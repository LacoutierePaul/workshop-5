# ben-or-consensus-algorithm

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue?logo=typescript&style=flat-square)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js->=18-green?logo=node.js&style=flat-square)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-passed-brightgreen?style=flat-square)](#)  

---

## Project Overview

This project implements the **Ben-Or decentralized consensus algorithm** in **TypeScript**. The Ben-Or algorithm uses randomness to achieve consensus in a decentralized network of nodes, which is fundamental for blockchain and other decentralized technologies.

The repository provides the basic network structure, and the goal was to implement the core algorithm logic inside this framework.

---

## What I Did

- Implemented the inner workings of the Ben-Or consensus algorithm following the project guidelines.
- Ensured the algorithm handles asynchronous consensus with probabilistic termination.
- Completed all the unit tests successfully, verifying the correctness of the implementation.
- Used TypeScript for strong typing and better code maintainability.
- Tested both with automated tests (`yarn test`) and manual network runs (`yarn start`).

---

## Setup & Usage

### Requirements
- Node.js version **18** or higher.
- Yarn package manager.

### Installation
```bash
yarn install
```

### Running Tests
```bash
yarn test
```

### Running the Network Manually
Modify the start.ts file with desired parameters, then:
```bash
yarn start
 ```


---

## Resources

To understand the Ben-Or algorithm, I referred to the following resources:

- [The Ben-Or Decentralized Consensus (Blog)](https://muratbuffalo.blogspot.com/2019/12/the-ben-or-decentralized-consensus.html)  
- [Ben-Or Consensus Lecture Slides (University of Washington)](https://courses.cs.washington.edu/courses/cse452/19sp/slides/l13-benor.pdf)  
- [Asynchronous Agreement: Ben-Or’s Protocol](https://decentralizedthoughts.github.io/2022-03-30-asynchronous-agreement-part-two-ben-ors-protocol/)  

---

## Grading

- Successfully passed all unit tests (20/20 points).  
- Implementation is original and completed individually, following the exercise rules.

