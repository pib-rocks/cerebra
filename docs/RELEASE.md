# Cerebra Release Process

The Docker image for cerebra is built and pushed automatically. The trigger is the
`develop -> main` merge, and the image version comes from the release tag that this
merge carries onto `main`.

**The release tag is the only place the version is stated.** There is no version file
to bump.

> ## Release order: pib-backend FIRST, cerebra second
>
> `cerebra` and `pib-backend` share **one** version number and are released **as a
> pair**. pib-backend is always released first, because cerebra is the consumer and
> its Docker build verifies that the matching backend release already exists.
>
> The cerebra Docker build **fails** if `pib-rocks/pib-backend` has no *published*
> release with the same tag. A cerebra image can therefore never be published against
> a backend version that was never released.

---

## The four steps

> **Step 0 — release pib-backend first.** Before any of the following, publish the
> same version in [`pib-rocks/pib-backend`](https://github.com/pib-rocks/pib-backend)
> (see its `docs/RELEASE.md`). If you skip this, step 4 fails on purpose.

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

### 2. Publish the release **on `develop`**

`release-drafter` keeps a draft release up to date on every push to `develop`. Open it
under **Releases** on GitHub, check the notes and the version, and press
**Publish release**.

> **Pitfall — this is the step people get wrong:**
> A **draft** release does **not** create a git tag. Only *publishing* it does.
> If you merge to `main` while the release is still a draft, the build has no tag to
> read and the pipeline fails on purpose (see step 4).

Verify the tag now exists on `develop`:

```bash
git fetch origin --tags --force
git tag --points-at origin/develop        # -> v0.6.1
```

### 3. Merge `develop -> main`

```bash
git checkout main
git pull origin main
git merge --no-ff develop -m "release v0.6.1"
git push origin main
```

The push to `main` triggers the **Docker Build Pipeline**.

### 4. Verify the build

The pipeline resolves the release tag from the merge and pushes two image tags:

- `ghcr.io/pib-rocks/cerebra:latest`
- `ghcr.io/pib-rocks/cerebra:v<version>`

Check the run under **Actions -> Docker Build Pipeline**. The
*Resolve release tag from the merge* step logs which tag it found.

---

## How the version is resolved

`.github/workflows/docker-build.yml`:

```bash
# --no-ff merge:      release tag sits on the 2nd parent (merged develop tip)
# fast-forward merge: release tag sits on HEAD itself
TAG="$(git tag --points-at HEAD^2 2>/dev/null | head -n1)"
[ -z "$TAG" ] && TAG="$(git tag --points-at HEAD | head -n1)"
[ -z "$TAG" ] && { echo "::error::No release tag found on this merge."; exit 1; }
```

### Why not `git describe`?

`git describe --tags --abbrev=0` was used previously and is **unsafe** here. It returns
the *nearest reachable* tag, so on a merge that carries **no** new release it returns the
**previous** release tag — a non-empty value. The build would then re-push an already
released image tag and report success:

| Situation | `git describe` | `git tag --points-at` |
|---|---|---|
| Release published on develop, merged | previous tag (**wrong**) | correct tag |
| Merged **without** publishing a release | previous tag → build proceeds (**dangerous**) | empty → run fails (**safe**) |

The failure mode matters more than the happy path: `git describe` fails *open* (wrong
image published quietly), `git tag --points-at` fails *closed* (loud error, nothing
pushed).

---

## Failure modes and what they mean

| Symptom | Cause | Fix |
|---|---|---|
| `No release tag found on this merge commit` | Merged to `main` while the release was still a draft, or no release was cut at all | Publish the release on `develop`, then merge again (or re-run after tagging) |
| `pib-backend has no release v…` | cerebra was released before pib-backend | Publish the same version in pib-backend first, then re-run the workflow |
| `pib-backend release v… is still a DRAFT` | The backend release exists but was never published | Publish it in pib-backend, then re-run |
| Release notes appear but no tag exists | The release is still a **draft** | Press *Publish release* |
| Tag was created on `main` instead of `develop` | `commitish: develop` missing in `release-drafter.yml` | Restore it; delete and recreate the tag on `develop` |

### If cerebra fails after pib-backend was already published

The pair is incomplete, and pib-backend's *Release Pairing Guard* will start reporting
it (as PENDING first, then as an error after 2 hours). Either finish the cerebra
release, or withdraw the pib-backend release so both sides stay in step.

---

## Version coupling with pib-backend

- Both repositories always carry the **same** tag, e.g. `v0.6.1`.
- Enforcement is two-sided:
  - **cerebra** (hard, blocking): the Docker build refuses to push unless
    pib-backend has a published release with the same tag.
  - **pib-backend** (monitoring): `release-pairing-guard.yml` checks after each
    release that cerebra follows, and fails if it never does.
- A local git hook is deliberately **not** used for this: hooks are not distributed
  with a clone, are bypassable with `--no-verify`, and would need setting up on every
  machine. The enforcement lives in CI.

### Optional token

Both repos are public, so the cross-repo check works unauthenticated (GitHub API
limit: 60 requests/hour). Setting the repository secret `RELEASE_GUARD_TOKEN` to a
token with read access raises that to 5000/hour and is recommended but not required.

---

## Notes

- The version is **not** displayed inside the app today. If that is added later, inject
  it at build time from the same tag rather than maintaining it by hand.
- `[skip ci]` in the merge commit message skips the Docker build job entirely.
- The image is built for `linux/arm64` only — the Raspberry Pi target.
