# Build & Release

## Build

```bash
vp build
```

Builds the extension into one folder per browser:

| Folder     | For     |
| ---------- | ------- |
| `dist/`    | Chrome  |
| `dist-ff/` | Firefox |

Both hold the same files, only `manifest.json` is slightly different between the browsers.

`vp build --watch` rebuilds on every change. To try a build, load `dist/` unpacked, see [`setup.md`](./setup.md).

### Version

Every build gets a version from `build/get-build-version.ts`, either a beta or release.

Release versions are simple; straight from package.json. You get a beta version if anything has changed since the last release, with a version bump depending on changesets.

| Build   | Chrome `version` | Chrome `version_name` | Firefox `version` |
| ------- | ---------------- | --------------------- | ----------------- |
| Release | 2.0.1            | 2.0.1                 | 2.0.1             |
| Beta    | 2.0.2            | 2.0.2-beta            | 0.2.0.2           |

Chrome supports a `version_name`, so beta versions can be labeled cleanly. Firefox does not support a `version_name`, instead we prefix beta versions with `0.` for Firefox.

## Package

```bash
vp run package
```

Runs `build/package-release.ts` (the `package` script). It:

1. removes `dist-ff/` and runs `vp build`, so the zips always come from a fresh build;
2. writes three zips to `releases/` (git-ignored), replacing those of the same version.

| File                                    | Contents                                                        |
| --------------------------------------- | --------------------------------------------------------------- |
| `twine-dugger-<version>-chrome.zip`     | `dist/`                                                         |
| `twine-dugger-<version>-ff.zip`         | `dist-ff/`                                                      |
| `twine-dugger-<version>-sourcecode.zip` | the files git tracks, plus untracked files that are not ignored |

`<version>` is the `version_name` of `dist/manifest.json`, so a beta has `-beta` in its file names. The sourcecode zip is required for Firefox's add-on review.

## Changesets

[Changesets](https://github.com/changesets/changesets) keep the version and the changelog in step with the changes.

You can add a changeset via:

```bash
vpx changeset
```

A GitHub workflow will automatically add any changesets to the `CHANGELOG.md` when a release version is created and tagged.

Note that Twine Dugger does not use "major means breaking changes".

- A major update is a big important update.
- A minor update is one or a few smaller features.
- A patch update is either a bugfix or something most users will never notice.
