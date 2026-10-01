# Cerebra Release Process

The Docker image for cerebra is built and pushed when a GitHub release is
**published**. The image version is that release's tag. The build does not wait
for a `develop -> main` merge: publishing the release is enough, including when
cerebra has no new commits and there is nothing to merge.

**The release tag is the only place the version is stated.** There is no version file
to bump.

> Workflows triggered by `release` are read from the repository's **default
> branch** (`main`). `.github/workflows/docker-build.yml` only takes effect for
> published releases once it is on `main`.

> ## Release order: pib-backend FIRST, cerebra second
>
> `cerebra` and `pib-backend` share **one** version number and are released **as a
> pair**. pib-backend is always released first, because cerebra is the consumer and
> its Docker build verifies that the matching backend release already exists.
>
> The cerebra Docker build **fails** if `pib-rocks/pib-backend` has no _published_
> release with the same tag. A cerebra image can therefore never be published against
> a backend version that was never released.

---

## The steps

> **Step 0 — release pib-backend first.** Before any of the following, publish the
> same version in [`pib-rocks/pib-backend`](https://github.com/pib-rocks/pib-backend)
> (see its `docs/RELEASE.md`). If you skip this, the Docker build fails on purpose.

### 1. Merge the work into `develop`

All feature branches are merged into `develop` (non-fast-forward, cerebra policy):

```bash
git checkout develop
git pull origin develop
git merge --no-ff PR-XXXX -m "merge: PR-XXXX <short description>"
```

Make sure the test suites are green before continuing:

```bash
CHROME_BIN=/usr/bin/chromium-browser npm test -- --watch=false --browsers=NoSandbox
```

When this release has **no** cerebra content changes, there is nothing to merge.
Skip this step. Publishing the existing `develop` tip still builds the image.

### 2. Publish the release **on `develop`**

`release-drafter` keeps a draft release up to date on every push to `develop`. Open it
under **Releases** on GitHub, check the notes and the version, and press
**Publish release**.

Publishing creates the git tag and triggers the **Docker Build Pipeline**. The
pipeline does not run on a draft, and it does not run on a push to `main`.

> **Pitfall — this is the step people get wrong:**
> A **draft** release does **not** create a git tag and does **not** start the
> build. Only _publishing_ it does.

Verify the tag now exists on `develop`:

```bash
git fetch origin --tags --force
git tag --points-at origin/develop        # -> v0.6.1
```

### 3. Verify the build

The pipeline takes the tag from the published release and pushes two image tags:

-   `ghcr.io/pib-rocks/cerebra:latest`
-   `ghcr.io/pib-rocks/cerebra:v<version>`

Check the run under **Actions -> Docker Build Pipeline**. The
_Resolve and validate the release tag_ step logs which tag it used.

To build a tag by hand (for example a release that was published before this
workflow was on `main`), run **Docker Build Pipeline** with `workflow_dispatch`
and set the required `tag` input, such as `v0.6.4`. The run checks out that tag.
It will not guess a version from the branch selected in the UI.

### `main` is not the image trigger

Merging `develop` into `main` does not build or publish the image. When cerebra
has no content changes, GitHub refuses that pull request (`No commits between
main and develop`). That is expected: publish the release and the image still
builds.

---

## How the version is resolved

`.github/workflows/docker-build.yml` takes the tag from exactly one place:

-   a published release: `github.event.release.tag_name`
-   a manual run: the required `tag` input (`inputs.tag`)

It then rejects the run unless that tag exists and the checked-out commit **is**
that tag:

```bash
# release:  TAG from github.event.release.tag_name
# dispatch: TAG from inputs.tag
[ -z "$TAG" ] && { echo "::error::No release tag provided."; exit 1; }

TAG_COMMIT="$(git rev-parse --verify --quiet "refs/tags/${TAG}^{commit}")" \
  || { echo "::error::Tag ${TAG} does not exist."; exit 1; }

[ "$(git rev-parse HEAD)" = "$TAG_COMMIT" ] \
  || { echo "::error::Checked-out commit is not tag ${TAG}."; exit 1; }
```

On a manual run the checkout ref is the requested tag, so the tree that is
built is the tagged commit. On a published release the default checkout is
already that tag.

There is no fallback to "the newest tag on `HEAD^2` or `HEAD`", and no use of
`git describe`. Two releases can point at the same commit. Guessing would select
the older tag, re-push an already published image, and report success. A missing
tag, an unknown tag, or a checkout that is not that tag fails the run before
anything is pushed.

---

## Failure modes and what they mean

| Symptom                                        | Cause                                                                              | Fix                                                                          |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `No release tag provided`                      | Manual run without the `tag` input                                                 | Re-run `workflow_dispatch` with `tag` set to the release, e.g. `v0.6.4`      |
| `Tag v… does not exist in this repository`     | The tag was never created (release still a draft) or the name is wrong            | Publish the release on `develop`, then re-run with that exact tag            |
| `Checked-out commit … is not tag v…`           | The checkout is a different tree than the tag                                      | The dispatch ref must be the tag; do not build from an unrelated branch      |
| `pib-backend has no release v…`                | cerebra was released before pib-backend                                            | Publish the same version in pib-backend first, then re-run the workflow      |
| `pib-backend release v… is still a DRAFT`      | The backend release exists but was never published                                 | Publish it in pib-backend, then re-run                                       |
| Release notes appear but no tag exists         | The release is still a **draft**                                                   | Press _Publish release_                                                      |
| Tag was created on `main` instead of `develop` | `commitish: develop` missing in `release-drafter.yml`                              | Restore it; delete and recreate the tag on `develop`                         |
| Publishing a release did not start a build     | This workflow file is not on the default branch yet                                | Merge it to `main`. Until then, dispatch it from `main` with an explicit tag |

### If cerebra fails after pib-backend was already published

The pair is incomplete, and pib-backend's _Release Pairing Guard_ will start reporting
it (as PENDING first, then as an error after 2 hours). Either finish the cerebra
release, or withdraw the pib-backend release so both sides stay in step.

---

## Version coupling with pib-backend

-   Both repositories always carry the **same** tag, e.g. `v0.6.1`.
-   Enforcement is two-sided:
    -   **cerebra** (hard, blocking): the Docker build refuses to push unless
        pib-backend has a published release with the same tag.
    -   **pib-backend** (monitoring): `release-pairing-guard.yml` checks after each
        release that cerebra follows, and fails if it never does.
-   A local git hook is deliberately **not** used for this: hooks are not distributed
    with a clone, are bypassable with `--no-verify`, and would need setting up on every
    machine. The enforcement lives in CI.

### Optional token

Both repos are public, so the cross-repo check works unauthenticated (GitHub API
limit: 60 requests/hour). Setting the repository secret `RELEASE_GUARD_TOKEN` to a
token with read access raises that to 5000/hour and is recommended but not required.

---

## Notes

-   The version is **not** displayed inside the app today. If that is added later, inject
    it at build time from the same tag rather than maintaining it by hand.
-   `[skip ci]` does **not** apply to this pipeline. A `release` event has no
    `head_commit`, so the old commit-message check could not see it and was removed.
    Publishing the release always builds the image.
-   The image is built for `linux/arm64` only — the Raspberry Pi target.
