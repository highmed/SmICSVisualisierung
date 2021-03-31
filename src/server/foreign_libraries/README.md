# Foreign language libraries

In here, other library-style functionality may be placed. Library in this case means that code in here should support a specific use case and have benefits over a plain Typescript implementation. In particular, these languages should be supported:
- C++

The interface to these code parts is done using [node's child processes](https://nodejs.org/docs/latest/api/child_process.html). On a higher level, textual or binary input for a foreign language algorithm is passed to a sub-process via standard input (*stdin*) and the result is read from standard output (*stdout*). This can be done efficiently (i.e. in-memory) using (Unix) pipes. The data exchange format is either JSON or CSV depending on the structure of the data.

## Installation

Generally, the individual submodules may need to be updated:

```bash
# initialize the submodules
git submodule init

# update the submodules; this might be repeated if changes are made to the required version
git submodule update --init --recursive

# this should do the same as the above
git pull --recurse-submodules

# to get an individual package up to date, change into the root of the git submodule and simply invoke
cd libraries/something/
git pull
# afterward, you probably want to change into the original git repository and commit the change to the parent repository
cd ../../
git add libraries/something/
git commit
```

### Installation of *praktikumcf2020*

First, dependencies need to be installed (the example is for Ubuntu 20.04):

```bash
sudo apt install g++ make cmake
```

Then, the project can be compiled:

```bash
cd libraries/praktikumcf2020/code
sh run_compiler.sh
cd ../../../
```
