import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {TransformControls} from "three/addons/controls/TransformControls.js";
import {STLLoader} from "three/addons/loaders/STLLoader.js";
import {
    CSS2DObject,
    CSS2DRenderer,
} from "three/addons/renderers/CSS2DRenderer.js";

const MODEL_PATH = "./models/";
const STORAGE_KEY = "pib-collision-planner-obstacles-v5";
const DEG = Math.PI / 180;
const MM = 0.001;
const JOINT_ANGLE_SCALE = {
    shoulder_vertical_left: -1,
};
const JOINT_ANGLE_OFFSET = {
    elbow_left: 10,
    upper_arm_right_rotation: 15,
    elbow_right: 30,
};
const ENCLOSURE = {
    name: "Safety enclosure",
    clear_size_mm: [1800, 1000, 1200],
    clear_center_mm: [0, -375, 600],
    rear_wall_y_mm: 125,
    wall_thickness_mm: 50,
    safety_margin_mm: 30,
};
const DEFAULT_OBSTACLES = [
    {
        id: "volume-4",
        name: "Volume 4",
        type: "box",
        position_mm: [-10, -27, 669],
        rotation_rpy_deg: [0, 89, 0],
        size_mm: [1000, 200, 280],
        safety_margin_mm: 30,
        ignored_links: [
            "shoulder_vertical_left",
            "shoulder_horizontal_left",
            "shoulder_vertical_right",
            "shoulder_horizontal_right",
            "upper_arm_right_rotation",
        ],
    },
    {
        id: "volume-5",
        name: "Volume 5",
        type: "box",
        position_mm: [0, -52, 331],
        rotation_rpy_deg: [0, 0, 0],
        size_mm: [2000, 2000, 260],
        safety_margin_mm: 30,
    },
    {
        id: "volume-6",
        name: "Volume 6",
        type: "box",
        position_mm: [-17, -325, 476],
        rotation_rpy_deg: [0, 0, 0],
        size_mm: [200, 300, 2000],
        safety_margin_mm: 30,
    },
    {
        id: "enclosure-left",
        name: "Enclosure left wall",
        type: "box",
        position_mm: [925, -375, 600],
        rotation_rpy_deg: [0, 0, 0],
        size_mm: [50, 1000, 1200],
        safety_margin_mm: 30,
    },
    {
        id: "enclosure-right",
        name: "Enclosure right wall",
        type: "box",
        position_mm: [-925, -375, 600],
        rotation_rpy_deg: [0, 0, 0],
        size_mm: [50, 1000, 1200],
        safety_margin_mm: 30,
    },
    {
        id: "enclosure-rear",
        name: "Enclosure rear wall",
        type: "box",
        position_mm: [0, 150, 600],
        rotation_rpy_deg: [0, 0, 0],
        size_mm: [1800, 50, 1200],
        safety_margin_mm: 30,
    },
    {
        id: "enclosure-front",
        name: "Enclosure front wall",
        type: "box",
        position_mm: [0, -900, 600],
        rotation_rpy_deg: [0, 0, 0],
        size_mm: [1800, 50, 1200],
        safety_margin_mm: 30,
    },
    {
        id: "enclosure-floor",
        name: "Enclosure floor",
        type: "box",
        position_mm: [0, -375, -25],
        rotation_rpy_deg: [0, 0, 0],
        size_mm: [1800, 1000, 50],
        safety_margin_mm: 30,
    },
    {
        id: "enclosure-ceiling",
        name: "Enclosure ceiling",
        type: "box",
        position_mm: [0, -375, 1225],
        rotation_rpy_deg: [0, 0, 0],
        size_mm: [1800, 1000, 50],
        safety_margin_mm: 30,
    },
];

const sceneHost = document.querySelector("#scene");
const statusOutput = document.querySelector("#status");
const jointControls = document.querySelector("#joint-controls");
const obstacleList = document.querySelector("#obstacle-list");
const obstacleEditor = document.querySelector("#obstacle-editor");
const obstacleName = document.querySelector("#obstacle-name");
const sizeFieldset = document.querySelector("#size-fieldset");
const safetyMargin = document.querySelector("#safety-margin");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1113);
scene.fog = new THREE.Fog(0x0e1113, 2.4, 5.5);

const camera = new THREE.PerspectiveCamera(42, 1, 0.005, 20);
camera.up.set(0, 0, 1);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sceneHost.append(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = "label-layer";
sceneHost.append(labelRenderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.minDistance = 0.25;
orbit.maxDistance = 5;
orbit.target.set(0, 0, 0.62);

const transform = new TransformControls(camera, renderer.domElement);
transform.setSpace("world");
transform.setTranslationSnap(0.001);
transform.setRotationSnap(DEG);
scene.add(transform);
transform.addEventListener("dragging-changed", (event) => {
    orbit.enabled = !event.value;
});
transform.addEventListener("objectChange", syncSelectedObstacleFromScene);

scene.add(new THREE.HemisphereLight(0xc9f5ff, 0x392d25, 1.65));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(-1.4, -1.6, 2.6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xffd9b0, 0.8);
fillLight.position.set(1.8, 0.9, 1.2);
scene.add(fillLight);

const ground = new THREE.GridHelper(2.4, 24, 0x566168, 0x2a3034);
ground.rotation.x = Math.PI / 2;
scene.add(ground);

const axes = new THREE.AxesHelper(0.25);
axes.position.set(0, 0, 0.002);
scene.add(axes);

const robotRoot = new THREE.Group();
robotRoot.name = "pib";
scene.add(robotRoot);

const stlLoader = new STLLoader();
let pendingMeshes = 0;
const joints = {left: [], right: []};
let activeSide = "left";
let latestRosPose = null;
let rosReconnectTimer = null;
let obstacles = loadObstacles();
let selectedObstacleId = null;
let obstacleCounter = obstacles.length + 1;
const obstacleObjects = new Map();

const armDefinitions = {
    left: [
        {
            name: "shoulder_vertical_left",
            label: "Shoulder vertical",
            min: -90,
            max: 90,
            axis: [1, 0, 0],
            anchor: [0.146867, 0.012566, 0.835688],
            orientation: [-0.57735, 0.57735, -0.57735, 2.094395],
            mesh: {
                file: "urdf_shoulder_vertical.stl",
                position: [0, 0, -0.006],
                rotation: [0.707107, 0, 0.707107, Math.PI],
            },
        },
        {
            name: "shoulder_horizontal_left",
            label: "Shoulder horizontal",
            min: -90,
            max: 90,
            axis: [0, -1, 0],
            anchor: [0, -0.037495, 0.059],
            orientation: [0.57735, -0.57735, 0.57735, 2.094395],
            mesh: {
                file: "urdf_shoulder_horizontal.stl",
                position: [0, -0.065, -0.0372],
                rotation: [-0.57735, -0.57735, 0.57735, 2.094395],
            },
        },
        {
            name: "upper_arm_left_rotation",
            label: "Upper arm rotation",
            min: -90,
            max: 90,
            axis: [-1, 0, 0],
            anchor: [0.14, 0, -0.0372],
            orientation: [-0.57735, -0.57735, 0.57735, 2.094395],
            mesh: {
                file: "urdf_elbow-upper.stl",
                position: [-0.065, 0.000001, 0.14],
            },
        },
        {
            name: "elbow_left",
            label: "Elbow",
            min: -45,
            max: 90,
            axis: [-1, 0, 0],
            anchor: [-0.0379, -0.021, -0.076338],
            orientation: [0.707107, 0, -0.707107, Math.PI],
            mesh: {
                file: "urdf_elbow-lower.stl",
                position: [-0.138124, -0.167824, 0.0272],
                rotation: [0.678598, 0.281085, -0.678598, 2.593564],
            },
        },
        {
            name: "lower_arm_left_rotation",
            label: "Lower arm rotation",
            min: -90,
            max: 90,
            axis: [-0.707107, -0.707107, 0],
            anchor: [0.076438, 0.04674, -0.0378],
            orientation: [0.678598, 0.281085, -0.678598, 2.593564],
            mesh: {
                file: "urdf_forearm.stl",
                position: [-0.064742, -0.000469, 0.303438],
            },
        },
        {
            name: "wrist_left",
            label: "Wrist",
            min: -30,
            max: 30,
            axis: [0, 1, 0],
            anchor: [0.015, 0.026, -0.1544],
            orientation: [0, -0.707107, -0.707107, Math.PI],
            mesh: {
                file: "urdf_palm_left.stl",
                position: [0.003, -0.1, -0.1827],
                rotation: [0.57735, 0.57735, -0.57735, 2.094395],
            },
        },
    ],
    right: [
        {
            name: "shoulder_vertical_right",
            label: "Shoulder vertical",
            min: -90,
            max: 90,
            axis: [-1, 0, 0],
            anchor: [-0.173133, 0.012566, 0.835688],
            orientation: [-0.57735, -0.57735, 0.57735, 2.094395],
            mesh: {
                file: "urdf_shoulder_vertical.stl",
                position: [0, 0, -0.006],
                rotation: [0.707107, 0, 0.707107, Math.PI],
            },
        },
        {
            name: "shoulder_horizontal_right",
            label: "Shoulder horizontal",
            min: -90,
            max: 90,
            axis: [0, -1, 0],
            anchor: [0, -0.037495, 0.059],
            orientation: [0.57735, -0.57735, 0.57735, 2.094395],
            mesh: {
                file: "urdf_shoulder_horizontal.stl",
                position: [0, 0.065, -0.0372],
                rotation: [0.57735, -0.57735, -0.57735, 2.094395],
            },
        },
        {
            name: "upper_arm_right_rotation",
            label: "Upper arm rotation",
            min: -90,
            max: 90,
            axis: [-1, 0, 0],
            anchor: [0.14, 0, -0.0372],
            orientation: [-0.57735, -0.57735, 0.57735, 2.094395],
            mesh: {
                file: "urdf_elbow-upper.stl",
                position: [-0.065, 0.000001, 0.14],
            },
        },
        {
            name: "elbow_right",
            label: "Elbow",
            min: -45,
            max: 90,
            axis: [-1, 0, 0],
            anchor: [-0.0379, -0.021, -0.076338],
            orientation: [-0.707107, 0, 0.707107, Math.PI],
            mesh: {
                file: "urdf_elbow-lower.stl",
                position: [-0.138124, -0.167824, 0.0272],
                rotation: [0.678598, 0.281085, -0.678598, 2.593564],
            },
        },
        {
            name: "lower_arm_right_rotation",
            label: "Lower arm rotation",
            min: -90,
            max: 90,
            axis: [-0.707107, -0.707107, 0],
            anchor: [0.076438, 0.04674, -0.0378],
            orientation: [0.357407, -0.862856, 0.357407, 1.717772],
            mesh: {
                file: "urdf_forearm.stl",
                position: [-0.064742, -0.000469, 0.303438],
            },
        },
        {
            name: "wrist_right",
            label: "Wrist",
            min: -30,
            max: 30,
            axis: [0, 1, 0],
            anchor: [0.015, 0.025, -0.1544],
            orientation: [0, -0.707107, -0.707107, Math.PI],
            mesh: {
                file: "urdf_palm_right.stl",
                position: [-0.078396, 0.456264, -0.025531],
                rotation: [-1, 0, 0, Math.PI / 2],
            },
        },
    ],
};

function axisAngleQuaternion(values = [0, 0, 1, 0]) {
    const [x, y, z, angle] = values;
    return new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(x, y, z).normalize(),
        angle,
    );
}

function setTransform(object, definition = {}) {
    if (definition.position) {
        object.position.fromArray(definition.position);
    }
    if (definition.rotation) {
        object.quaternion.copy(axisAngleQuaternion(definition.rotation));
    }
}

function loadMesh(parent, definition, color = 0xd8dee1) {
    pendingMeshes += 1;
    stlLoader.load(
        MODEL_PATH + definition.file,
        (geometry) => {
            geometry.computeVertexNormals();
            const material = new THREE.MeshStandardMaterial({
                color,
                roughness: 0.72,
                metalness: 0.05,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            setTransform(mesh, definition);
            parent.add(mesh);
            pendingMeshes -= 1;
            updateLoadingStatus();
        },
        undefined,
        () => {
            pendingMeshes -= 1;
            setStatus(`Could not load ${definition.file}`);
        },
    );
}

function createJoint(parent, definition, side, index, showMarker = true) {
    const driver = new THREE.Group();
    driver.name = definition.name;
    driver.position.fromArray(definition.anchor);
    parent.add(driver);

    const endpoint = new THREE.Group();
    endpoint.quaternion.copy(axisAngleQuaternion(definition.orientation));
    driver.add(endpoint);

    const joint = {
        ...definition,
        angle: 0,
        axisVector: new THREE.Vector3(...definition.axis).normalize(),
        driver,
        endpoint,
        labelObject: null,
    };

    if (showMarker) {
        const markerMaterial = new THREE.MeshStandardMaterial({
            color: side === "left" ? 0x32c7d9 : 0x55d68b,
            emissive: side === "left" ? 0x0b5660 : 0x174d2e,
            emissiveIntensity: 0.4,
        });
        const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.012, 20, 12),
            markerMaterial,
        );
        driver.add(marker);

        const labelElement = document.createElement("span");
        labelElement.className = "joint-label";
        labelElement.textContent = `${index + 1} ${definition.label}`;
        const label = new CSS2DObject(labelElement);
        label.position.set(0, 0, 0.022);
        driver.add(label);
        joint.labelObject = label;
    }

    if (definition.mesh) {
        loadMesh(endpoint, definition.mesh, side === "left" ? 0xdce7ea : 0xd8ded9);
    }

    return joint;
}

function buildRobot() {
    loadMesh(robotRoot, {
        file: "urdf_body.stl",
        position: [-0.013133, 0.012566, 0.891187],
    }, 0xbfc7ca);

    const headHorizontal = createJoint(
        robotRoot,
        {
            name: "head_horizontal",
            label: "Head horizontal",
            axis: [0, 0, -1],
            anchor: [-0.013134, 0.012566, 0.987187],
            orientation: [0.999999, -0.001451, 0, Math.PI],
            mesh: {
                file: "urdf_head_base.stl",
                position: [0, 0, 0.0966],
                rotation: [1, 0, 0, Math.PI],
            },
        },
        "head",
        0,
        false,
    );
    createJoint(
        headHorizontal.endpoint,
        {
            name: "head_vertical",
            label: "Head vertical",
            axis: [-1, 0, 0],
            anchor: [-0.04125, 0.048, -0.0129],
            orientation: [0.57735, -0.57735, -0.57735, 2.094395],
            mesh: {
                file: "urdf_head.stl",
                position: [0.048, 0.1095, -0.04175],
                rotation: [0.57735, 0.57735, -0.57735, 2.094395],
            },
        },
        "head",
        1,
        false,
    );

    for (const side of ["left", "right"]) {
        let parent = robotRoot;
        armDefinitions[side].forEach((definition, index) => {
            const joint = createJoint(parent, definition, side, index);
            joints[side].push(joint);
            parent = joint.endpoint;
        });
    }

    updateJointLabelVisibility();
}

function updateLoadingStatus() {
    if (pendingMeshes === 0) {
        setStatus("Model ready. Drag to orbit; scroll to zoom.");
    } else {
        setStatus(`Loading ${pendingMeshes} mesh${pendingMeshes === 1 ? "" : "es"}...`);
    }
}

function setJointAngle(joint, degrees) {
    joint.angle = Number(degrees);
    joint.driver.quaternion.setFromAxisAngle(
        joint.axisVector,
        (
            joint.angle * (JOINT_ANGLE_SCALE[joint.name] ?? 1)
            + (JOINT_ANGLE_OFFSET[joint.name] ?? 0)
        ) * DEG,
    );
}

function applyRosPose(pose) {
    if (!pose) {
        return;
    }
    let changed = false;
    for (const side of ["left", "right"]) {
        for (const joint of joints[side]) {
            if (!(joint.name in pose)) {
                continue;
            }
            const degrees = Number(pose[joint.name]) / 100;
            if (!Number.isFinite(degrees) || joint.angle === degrees) {
                continue;
            }
            setJointAngle(joint, degrees);
            changed = true;
        }
    }
    if (changed) {
        renderJointControls();
    }
}

function collisionPoseFromMessage(message) {
    const names = message?.joint_names;
    const points = message?.points;
    if (!Array.isArray(names) || !Array.isArray(points) || points.length === 0) {
        return null;
    }

    const pose = {};
    if (points.length === 1 && Array.isArray(points[0]?.positions)) {
        names.forEach((name, index) => {
            pose[name] = points[0].positions[index];
        });
    } else {
        names.forEach((name, index) => {
            pose[name] = points[index]?.positions?.[0];
        });
    }
    return pose;
}

function connectLivePose() {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(
        `${protocol}://${window.location.hostname}:9090`,
    );
    const liveButton = document.querySelector("#live-pose");

    socket.addEventListener("open", () => {
        socket.send(
            JSON.stringify({
                op: "subscribe",
                topic: "/collision_arm_positions",
                type: "trajectory_msgs/msg/JointTrajectory",
                throttle_rate: 250,
            }),
        );
    });
    socket.addEventListener("message", (event) => {
        try {
            const payload = JSON.parse(event.data);
            if (
                payload.op !== "publish" ||
                payload.topic !== "/collision_arm_positions"
            ) {
                return;
            }
            const pose = collisionPoseFromMessage(payload.msg);
            if (!pose) {
                return;
            }
            latestRosPose = pose;
            liveButton.disabled = false;
            liveButton.classList.add("active");
            liveButton.title = "Showing the latest ROS collision pose";
            applyRosPose(latestRosPose);
        } catch {
            liveButton.title = "Could not read the ROS collision pose";
        }
    });
    socket.addEventListener("close", () => {
        liveButton.classList.remove("active");
        liveButton.title = "Waiting for the ROS collision pose";
        window.clearTimeout(rosReconnectTimer);
        rosReconnectTimer = window.setTimeout(connectLivePose, 2000);
    });
}

function renderJointControls() {
    jointControls.replaceChildren();
    joints[activeSide].forEach((joint) => {
        const row = document.createElement("div");
        row.className = "joint-row";

        const label = document.createElement("label");
        label.htmlFor = `${joint.name}-range`;
        label.textContent = joint.label;

        const range = document.createElement("input");
        range.id = `${joint.name}-range`;
        range.type = "range";
        range.min = joint.min;
        range.max = joint.max;
        range.step = 1;
        range.value = joint.angle;

        const number = document.createElement("input");
        number.type = "number";
        number.min = joint.min;
        number.max = joint.max;
        number.step = 1;
        number.value = joint.angle;
        number.setAttribute("aria-label", `${joint.label} in degrees`);

        const applyValue = (value) => {
            const bounded = Math.max(joint.min, Math.min(joint.max, Number(value)));
            range.value = bounded;
            number.value = bounded;
            setJointAngle(joint, bounded);
        };
        range.addEventListener("input", () => applyValue(range.value));
        number.addEventListener("input", () => applyValue(number.value));

        row.append(label, range, number);
        jointControls.append(row);
    });
}

function updateJointLabelVisibility() {
    for (const side of ["left", "right"]) {
        joints[side].forEach((joint) => {
            if (joint.labelObject) {
                joint.labelObject.visible = side === activeSide;
            }
        });
    }
}

function activateSide(side) {
    activeSide = side;
    for (const candidate of ["left", "right"]) {
        const button = document.querySelector(`#${candidate}-arm-tab`);
        const active = candidate === side;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
    }
    updateJointLabelVisibility();
    renderJointControls();
}

function loadObstacles() {
    try {
        const serialized = localStorage.getItem(STORAGE_KEY);
        if (serialized === null) {
            return JSON.parse(JSON.stringify(DEFAULT_OBSTACLES));
        }
        const stored = JSON.parse(serialized);
        return Array.isArray(stored)
            ? stored
            : JSON.parse(JSON.stringify(DEFAULT_OBSTACLES));
    } catch {
        return JSON.parse(JSON.stringify(DEFAULT_OBSTACLES));
    }
}

function saveObstacles() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obstacles));
}

function defaultObstacle(type) {
    const index = obstacleCounter++;
    return {
        id: `${type}-${Date.now()}-${index}`,
        name: type === "plane" ? `Plane ${index}` : `Volume ${index}`,
        type,
        position_mm: [0, -350, type === "plane" ? 350 : 500],
        rotation_rpy_deg: type === "plane" ? [90, 0, 0] : [0, 0, 0],
        size_mm: type === "box" ? [400, 300, 300] : null,
        safety_margin_mm: 30,
    };
}

function createObstacleObject(obstacle) {
    const group = new THREE.Group();
    group.name = obstacle.name;
    group.userData.obstacleId = obstacle.id;

    let mesh;
    if (obstacle.type === "plane") {
        mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 10),
            new THREE.MeshStandardMaterial({
                color: 0xf5c451,
                transparent: true,
                opacity: 0.23,
                side: THREE.DoubleSide,
                depthWrite: false,
            }),
        );
        const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(mesh.geometry),
            new THREE.LineBasicMaterial({color: 0xf5c451}),
        );
        const normal = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, 0),
            0.18,
            0xf5c451,
            0.045,
            0.025,
        );
        group.add(mesh, edges, normal);
    } else {
        mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({
                color: 0xff6b5e,
                transparent: true,
                opacity: 0.25,
                depthWrite: false,
            }),
        );
        const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(mesh.geometry),
            new THREE.LineBasicMaterial({color: 0xff8d83}),
        );
        const safetyEdges = new THREE.LineSegments(
            new THREE.EdgesGeometry(mesh.geometry),
            new THREE.LineDashedMaterial({
                color: 0xf5c451,
                dashSize: 0.04,
                gapSize: 0.02,
            }),
        );
        safetyEdges.name = "safety-margin";
        safetyEdges.computeLineDistances();
        group.add(mesh, edges, safetyEdges);
    }

    group.traverse((child) => {
        child.userData.obstacleId = obstacle.id;
    });
    scene.add(group);
    obstacleObjects.set(obstacle.id, group);
    updateObstacleObject(obstacle);
}

function updateObstacleObject(obstacle) {
    const object = obstacleObjects.get(obstacle.id);
    if (!object) {
        return;
    }
    object.name = obstacle.name;
    object.position.fromArray(obstacle.position_mm.map((value) => value * MM));
    const [roll, pitch, yaw] = obstacle.rotation_rpy_deg;
    object.rotation.set(roll * DEG, pitch * DEG, yaw * DEG, "XYZ");
    object.scale.set(1, 1, 1);
    if (obstacle.type === "box") {
        object.scale.fromArray(obstacle.size_mm.map((value) => value * MM));
        const safetyEdges = object.getObjectByName("safety-margin");
        const margin = obstacle.safety_margin_mm;
        safetyEdges.scale.fromArray(
            obstacle.size_mm.map((value) => (value + margin * 2) / value),
        );
    }
}

function renderObstacleList() {
    obstacleList.replaceChildren();
    if (obstacles.length === 0) {
        const empty = document.createElement("p");
        empty.className = "eyebrow";
        empty.textContent = "No forbidden geometry defined";
        obstacleList.append(empty);
        return;
    }

    obstacles.forEach((obstacle) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "obstacle-item";
        item.dataset.type = obstacle.type;
        item.classList.toggle("active", obstacle.id === selectedObstacleId);

        const swatch = document.createElement("i");
        const name = document.createElement("span");
        name.textContent = obstacle.name;
        const type = document.createElement("small");
        type.textContent = obstacle.type === "plane" ? "PLANE" : "BOX";
        item.append(swatch, name, type);
        item.addEventListener("click", () => selectObstacle(obstacle.id));
        obstacleList.append(item);
    });
}

function createCoordinateFields(containerId, prefixes, values, onInput) {
    const container = document.querySelector(`#${containerId}`);
    container.replaceChildren();
    prefixes.forEach((prefix, index) => {
        const label = document.createElement("label");
        label.className = "coordinate-field";
        label.textContent = prefix;
        const input = document.createElement("input");
        input.type = "number";
        input.step = 1;
        input.value = Math.round(values[index] * 100) / 100;
        input.addEventListener("input", () => onInput(index, Number(input.value)));
        label.append(input);
        container.append(label);
    });
}

function selectObstacle(id) {
    selectedObstacleId = id;
    const obstacle = obstacles.find((candidate) => candidate.id === id);
    renderObstacleList();

    if (!obstacle) {
        obstacleEditor.hidden = true;
        transform.detach();
        return;
    }

    obstacleEditor.hidden = false;
    obstacleName.value = obstacle.name;
    safetyMargin.value = obstacle.safety_margin_mm;
    sizeFieldset.hidden = obstacle.type !== "box";
    transform.attach(obstacleObjects.get(obstacle.id));

    createCoordinateFields(
        "position-fields",
        ["X", "Y", "Z"],
        obstacle.position_mm,
        (index, value) => {
            obstacle.position_mm[index] = value;
            updateObstacleObject(obstacle);
            saveObstacles();
        },
    );
    createCoordinateFields(
        "rotation-fields",
        ["R", "P", "Y"],
        obstacle.rotation_rpy_deg,
        (index, value) => {
            obstacle.rotation_rpy_deg[index] = value;
            updateObstacleObject(obstacle);
            saveObstacles();
        },
    );
    if (obstacle.type === "box") {
        createCoordinateFields(
            "size-fields",
            ["X", "Y", "Z"],
            obstacle.size_mm,
            (index, value) => {
                obstacle.size_mm[index] = Math.max(1, value);
                updateObstacleObject(obstacle);
                saveObstacles();
            },
        );
    }
}

function syncSelectedObstacleFromScene() {
    const obstacle = obstacles.find(
        (candidate) => candidate.id === selectedObstacleId,
    );
    const object = obstacleObjects.get(selectedObstacleId);
    if (!obstacle || !object) {
        return;
    }

    obstacle.position_mm = object.position.toArray().map((value) => value / MM);
    obstacle.rotation_rpy_deg = [
        object.rotation.x / DEG,
        object.rotation.y / DEG,
        object.rotation.z / DEG,
    ];
    saveObstacles();
    updateCoordinateInputs("position-fields", obstacle.position_mm);
    updateCoordinateInputs("rotation-fields", obstacle.rotation_rpy_deg);
}

function updateCoordinateInputs(containerId, values) {
    document
        .querySelectorAll(`#${containerId} input`)
        .forEach((input, index) => {
            input.value = Math.round(values[index] * 100) / 100;
        });
}

function addObstacle(type) {
    const obstacle = defaultObstacle(type);
    obstacles.push(obstacle);
    createObstacleObject(obstacle);
    saveObstacles();
    selectObstacle(obstacle.id);
}

function deleteSelectedObstacle() {
    const object = obstacleObjects.get(selectedObstacleId);
    if (object) {
        transform.detach();
        scene.remove(object);
        object.traverse((child) => {
            child.geometry?.dispose();
            child.material?.dispose();
        });
        obstacleObjects.delete(selectedObstacleId);
    }
    obstacles = obstacles.filter(
        (obstacle) => obstacle.id !== selectedObstacleId,
    );
    selectedObstacleId = null;
    saveObstacles();
    renderObstacleList();
    obstacleEditor.hidden = true;
}

function normalForPlane(obstacle) {
    const euler = new THREE.Euler(
        ...obstacle.rotation_rpy_deg.map((value) => value * DEG),
        "XYZ",
    );
    return new THREE.Vector3(0, 0, 1)
        .applyEuler(euler)
        .toArray()
        .map((value) => Math.round(value * 1000000) / 1000000);
}

function exportConfiguration() {
    return {
        version: 1,
        coordinate_system: {
            unit: "mm",
            origin: "pib Webots base at floor centre",
            x: "left/right",
            y: "front/back",
            z: "height",
        },
        enclosure: ENCLOSURE,
        obstacles: obstacles.map((obstacle) => {
            const common = {
                name: obstacle.name,
                type: obstacle.type,
                rotation_rpy_deg: obstacle.rotation_rpy_deg.map((value) =>
                    Math.round(value * 1000) / 1000
                ),
                safety_margin_mm: obstacle.safety_margin_mm,
            };
            if (obstacle.ignored_links?.length) {
                common.ignored_links = [...obstacle.ignored_links];
            }
            if (obstacle.type === "plane") {
                return {
                    ...common,
                    infinite: true,
                    point_mm: obstacle.position_mm.map(Math.round),
                    normal: normalForPlane(obstacle),
                };
            }
            return {
                ...common,
                center_mm: obstacle.position_mm.map(Math.round),
                size_mm: obstacle.size_mm.map(Math.round),
            };
        }),
    };
}

function setStatus(message) {
    statusOutput.textContent = message;
}

function setCamera(position) {
    camera.position.fromArray(position);
    orbit.target.set(0, 0, 0.62);
    orbit.update();
}

function bindEvents() {
    document.querySelector("#left-arm-tab").addEventListener("click", () =>
        activateSide("left")
    );
    document.querySelector("#right-arm-tab").addEventListener("click", () =>
        activateSide("right")
    );
    document.querySelector("#live-pose").addEventListener("click", () => {
        applyRosPose(latestRosPose);
        setStatus("Latest ROS collision pose applied.");
    });
    document.querySelector("#reset-pose").addEventListener("click", () => {
        for (const side of ["left", "right"]) {
            joints[side].forEach((joint) => setJointAngle(joint, 0));
        }
        renderJointControls();
    });
    document.querySelector("#add-plane").addEventListener("click", () =>
        addObstacle("plane")
    );
    document.querySelector("#add-box").addEventListener("click", () =>
        addObstacle("box")
    );
    document
        .querySelector("#delete-obstacle")
        .addEventListener("click", deleteSelectedObstacle);

    obstacleName.addEventListener("input", () => {
        const obstacle = obstacles.find(
            (candidate) => candidate.id === selectedObstacleId,
        );
        if (obstacle) {
            obstacle.name = obstacleName.value;
            saveObstacles();
            renderObstacleList();
        }
    });
    safetyMargin.addEventListener("input", () => {
        const obstacle = obstacles.find(
            (candidate) => candidate.id === selectedObstacleId,
        );
        if (obstacle) {
            obstacle.safety_margin_mm = Math.max(0, Number(safetyMargin.value));
            updateObstacleObject(obstacle);
            saveObstacles();
        }
    });

    document.querySelector("#move-mode").addEventListener("click", () => {
        transform.setMode("translate");
        document.querySelector("#move-mode").classList.add("active");
        document.querySelector("#rotate-mode").classList.remove("active");
    });
    document.querySelector("#rotate-mode").addEventListener("click", () => {
        transform.setMode("rotate");
        document.querySelector("#rotate-mode").classList.add("active");
        document.querySelector("#move-mode").classList.remove("active");
    });

    document.querySelector("#front-view").addEventListener("click", () =>
        setCamera([0, -2.15, 0.8])
    );
    document.querySelector("#side-view").addEventListener("click", () =>
        setCamera([2.15, 0, 0.8])
    );
    document.querySelector("#top-view").addEventListener("click", () =>
        setCamera([0, 0.001, 2.65])
    );
    document.querySelector("#fit-view").addEventListener("click", () =>
        setCamera([1.45, -1.75, 1.25])
    );

    document.querySelector("#copy-json").addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(
                JSON.stringify(exportConfiguration(), null, 2),
            );
            setStatus("Collision configuration copied to clipboard.");
        } catch {
            setStatus("Clipboard access was blocked by the browser.");
        }
    });
    document.querySelector("#download-json").addEventListener("click", () => {
        const blob = new Blob(
            [JSON.stringify(exportConfiguration(), null, 2)],
            {type: "application/json"},
        );
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "pib-collision-geometry.json";
        link.click();
        URL.revokeObjectURL(link.href);
    });

    renderer.domElement.addEventListener("pointerdown", selectObstacleFromPointer);
    window.addEventListener("resize", resize);
}

function selectObstacleFromPointer(event) {
    if (transform.dragging) {
        return;
    }
    const bounds = renderer.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(
        [...obstacleObjects.values()],
        true,
    );
    const id = intersections[0]?.object.userData.obstacleId;
    if (id) {
        selectObstacle(id);
    }
}

function resize() {
    const width = sceneHost.clientWidth;
    const height = sceneHost.clientHeight;
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    labelRenderer.setSize(width, height);
}

function animate() {
    requestAnimationFrame(animate);
    orbit.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

buildRobot();
obstacles.forEach(createObstacleObject);
renderObstacleList();
renderJointControls();
bindEvents();
setCamera([1.45, -1.75, 1.25]);
resize();
animate();
connectLivePose();
