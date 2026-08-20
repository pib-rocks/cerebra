# Cerebra Release Process

The Docker image for cerebra is built and pushed automatically. The trigger is the
`develop -> main` merge, and the image version comes from the release tag that this
merge carries onto `main`.

**The release tag is the only place the version is stated.** There is no version file
to bump.

---

## The four steps

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
| Release notes appear but no tag exists | The release is still a **draft** | Press *Publish release* |
| Tag was created on `main` instead of `develop` | `commitish: develop` missing in `release-drafter.yml` | Restore it; delete and recreate the tag on `develop` |

---

## Notes

- The version is **not** displayed inside the app today. If that is added later, inject
  it at build time from the same tag rather than maintaining it by hand.
- `[skip ci]` in the merge commit message skips the Docker build job entirely.
- The image is built for `linux/arm64` only — the Raspberry Pi target.
