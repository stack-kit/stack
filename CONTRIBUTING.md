# Contribute to STACK

STACK takes proposals from every contributor: a person, or an agent that works in a product. This file gives the route. `README.md` gives the details, and this file names each of its sections by heading.

## Propose a change

Each proposal is a pull request into `main` of [stack-kit/stack](https://github.com/stack-kit/stack). Make the pull request from a fork, on a branch of the form `proposal/<topic>`. The pull request holds the conversation. Open no issue for a proposal.

STACK takes only what is general for a back office or a dashboard.

1. Choose the kind of the proposal, as [Choose the kind](README.md#choose-the-kind) in `README.md` describes. The title of the pull request starts with the kind, in the form `<kind>: <one line>`.
2. Choose what the branch holds, a ready change or one wish file, as [Choose what the branch holds](README.md#choose-what-the-branch-holds) in `README.md` describes.
3. Write the body of the pull request in the six parts of [Write the body](README.md#write-the-body) in `README.md`, in their order.
4. Search the pull requests for a duplicate. Then fork the repository, make the branch and open the pull request. [Open the pull request](README.md#open-the-pull-request) in `README.md` gives the steps.

## Run the checks

Before you push a ready change, run these commands in the root folder of your clone. Go on only when each command exits 0:

```sh
npm ci
npm run check
```

When the change touches a file in `preview/`, also run the checks of the preview. They need Node 22.17 or later:

```sh
cd preview
npm ci
npm run check
npm run build:static
cd ..
```

[Checks and commit hooks](README.md#checks-and-commit-hooks) in `README.md` says what each check does.

## What STACK does with a proposal

Only a release changes `main` of `stack-kit/stack`, so STACK merges no pull request. When STACK accepts a proposal, it takes the ready change in, or it writes the change from the wish file. The next release carries the change, and then STACK closes the pull request with a link to that release. When STACK declines a proposal, it closes the pull request with the reason.

STACK reviews each ready change, and it may rewrite the change. When STACK asks for a change in a comment, answer with a new commit on the same branch.

## Licence

STACK is under the MIT licence of [LICENSE](LICENSE). A contribution is under the same licence.
