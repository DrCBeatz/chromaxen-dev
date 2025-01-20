# ChromaXen

ChromaXen is a solo puzzle game that uses size-3 Elementary Cellular Automata (ECA) rules on an 8x8 grid. Your goal is to match each row’s final column color to a target. Drag and drop rule icons onto rows, then ‘Advance’ to evolve the colors according to the selected rules. Scores are tracked by both time and fewest moves.

---

## Table of Contents

1. [Overview](#overview)
2. [How to Play & Cellular Automata Explanation](#how-to-play--cellular-automata-explanation)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [Directory Structure](#directory-structure)
6. [Local Development](#local-development)
   - [Prerequisites](#prerequisites)
   - [Running the App Locally via Docker Compose](#running-the-app-locally-via-docker-compose)
7. [Testing & Coverage](#testing--coverage)
   - [Frontend Tests](#frontend-tests)
   - [Backend Tests](#backend-tests)
   - [Coverage](#coverage)
8. [Infrastructure and Deployment](#infrastructure-and-deployment)
   - [Terraform for AWS](#terraform-for-aws)
   - [Dockerfiles](#dockerfiles)
   - [Environment Variables](#environment-variables)
9. [Contributing](#contributing)
10. [License](#license)
11. [Contact](#contact)

---

## Overview

ChromaXen is a colour-based puzzle game where each level has its own rules that dictate colour transitions and piece movements. Within this repository:

- **Frontend**: A Vite-driven application (using ES6 JavaScript, HTML, and CSS) for the puzzle UI.
- **Backend**: A FastAPI-based REST service for storing and retrieving high scores in a DynamoDB table.
- **Infrastructure**: Terraform configurations for deploying the application on AWS, using services including S3, Lambda, DynamoDB, and API Gateway. Dockerfiles and Docker Compose are provided for local development or production.

---

## How to Play & Cellular Automata Explanation

Below is a detailed overview of how **Elementary Cellular Automata (ECA)** are used in ChromaXen and the basic gameplay mechanics:

### Game Setup

- **Board**: An 8x8 grid.
- **Starting Pieces**: 8 randomly chosen colours (excluding black and grey) placed in column 1.
- **Target Pieces**: 8 randomly chosen colours (including black and grey) placed in column 8.
- **ECA Rules**: Each row has an assigned Elementary Cellular Automaton rule, displayed as a graphical icon next to column 1.

### ECA Icons

- Each icon shows the transition diagram for one of the [256 possible ECA rules](https://chromaxen.com/all_rules.htm).
- An arrow icon indicates how the colour evolves on the next step (e.g., green → yellow → red).
- A single coloured dot without an arrow indicates the colour is “frozen” for subsequent steps.
- If an arrow points to a black or grey dot, that colour will freeze and never revert on future steps.

### Gameplay

1. **Colour Evolution**  
   Each column (after the first) is determined by applying the ECA rules to the previous column.
2. **Player Interaction**
   - On your turn, you **select** an ECA rule icon from the left of column 1.
   - You then **apply** this selected rule to a chosen row.
   - The game updates the colours in that row based on the newly applied rule.
3. **Anticipation**  
   You must predict how each row will evolve after repeated applications of these rules, ensuring column 7 correctly transitions into column 8’s target colours.
4. **Winning Condition**  
   You win when the colours in column 7 will exactly match the target colours in column 8 upon the next step.

### ChromaXen and 1-D Cellular Automata

- **Rule-Based Transformation**: Each row follows a unique ECA rule (from 0 to 255), dictating how colours evolve from one column to the next.
- **Colour as State**: Each coloured circle represents a cell’s current state.
- **Local Interaction**: The colour of a circle in column _n_ depends only on its colour in column _n-1_, governed by that row’s ECA rule. Rows do not interact with each other.
- **Deterministic Evolution**: Given starting colours and ECA rules, the sequence of colour transformations is deterministic (no randomness beyond the initial seed).

### ECA Binary State to Colour Map

Here is the binary-to-colour mapping used in ChromaXen:

```plaintext
000 -> grey
001 -> red
010 -> orange
011 -> yellow
100 -> green
101 -> blue
110 -> purple
111 -> black
```

---

## Features

- **Interactive Puzzle Board**: Drag-and-drop or click-based colour transitions on an 8x8 grid.
- **Multiple Levels & Presets**: Each level has distinct ECA rules, automatically loaded from an XML or JSON file.
- **High Score Tracking**: A scoreboard that tracks top players (moves/time) in DynamoDB.
- **Save/Load Game**: Export and import partial or completed game states.
- **Randomization**: Quickly load random puzzle configurations and rules.
- **Extensive Test Suite**: Currently ~80% coverage on the frontend, including unit tests for core modules.
- **Dockerized Development**: Both frontend and backend can be spun up using Docker Compose.
- **AWS-Ready Deployment**: Terraform resources to provision S3, CloudFront, DynamoDB, API Gateway, and more.

---

## Tech Stack

- **Frontend**:

  - [Vite](https://vitejs.dev/)
  - [Node.js 18 (Alpine)](https://hub.docker.com/_/node)
  - [Vitest](https://vitest.dev/) for testing

- **Backend**:

  - [Python 3.9](https://www.python.org/)
  - [FastAPI](https://fastapi.tiangolo.com/)
  - [Pytest](https://docs.pytest.org/) + [moto](https://github.com/spulec/moto) for DynamoDB mocking

- **Infrastructure**:
  - [Docker](https://docs.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
  - [Terraform](https://www.terraform.io/) for AWS infrastructure provisioning
  - [AWS Cloud Services](https://aws.amazon.com/) (CloudFront, S3, Route53, DynamoDB, API Gateway, Lambda)

---

## Directory Structure

Below is a high-level view of the repository structure (omitting `node_modules/` and large image directories):

```plaintext
├── backend/
│   ├── tests/
│   │   └── test_main.py # Pytest-based backend tests
│   ├── main.py          # FastAPI entrypoint
│   └── requirements.txt # Python dependencies for production
├── frontend/
│   ├── css/             # CSS stylesheets
│   ├── jscript/
│   │   ├── tests/       # Vitest-based frontend tests
│   │   ├── main.js      # Entry point for the frontend
│   │   ├── gameUI.js
│   │   ├── gamelogic.js
│   │   ├── ...          # Additional JS modules
│   ├── index.html       # Main HTML file
│   ├── package.json
│   ├── package-lock.json
│   ├── Dockerfile       # Frontend Dockerfile
│   └── vitest.config.js # Vitest configuration
├── coverage/            # Coverage output (frontend)
├── docker-compose.yml   # Docker Compose for local dev
├── Dockerfile.test      # Dockerfile for testing
├── env.example.json     # Example environment file
├── main.tf              # Terraform configuration
├── requirements-test.txt # Python dependencies for test environment
└── README.md            # This file
```

---

## Local Development

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)
- [Terraform](https://developer.hashicorp.com/terraform/downloads) (optional if you want to deploy to AWS)
- [Python 3.9+](https://www.python.org/) _(if you plan to run local tests or scripts)_

### Running the App Locally via Docker Compose

The **frontend** and **backend** are intended to run via Docker Compose. This also spins up a local DynamoDB instance for testing.

```bash
docker-compose up --build
```

---

- **Frontend** is served at [http://localhost:5173](http://localhost:5173).
- **Backend** (FastAPI) is served at [http://localhost:8000](http://localhost:8000).
- **DynamoDB** Local is available at [http://localhost:8001](http://localhost:8001).

**Note**: The backend is **only** supported via Docker Compose in this project. If you need a custom setup, adapt the Docker configuration or coordinate with the existing `Dockerfile.dev`.

---

## Testing & Coverage

### Frontend Tests

- Uses [Vitest](https://vitest.dev/) with `jsdom` environment.
- To run frontend tests:

```bash
cd frontend
npm install
npm run test
```

- Coverage reports are generated in the `frontend/coverage/` directory (HTML, LCOV, and text).

### Backend Tests

- Uses `pytest` + [moto](https://github.com/spulec/moto) to mock DynamoDB.
- Run backend tests via Docker Compose (service: `test`):

```bash
docker-compose run test
```

### Coverage

- **Frontend**: Currently at **80%** test coverage.
- **Backend**: Additional test coverage can be integrated via Pytest plugins. The existing tests focus on DynamoDB CRUD operations.

---

## Infrastructure and Deployment

### Terraform for AWS

This repository includes Terraform configurations (`main.tf` and related files) for deploying:

- **S3** for hosting the frontend,
- **CloudFront** for CDN distribution,
- **Route53** for DNS records,
- **DynamoDB** for high scores,
- **API Gateway** + **Lambda** for the backend.

**Steps to Deploy**:

1. **Configure AWS credentials** via `aws configure` or environment variables.
2. **Initialize Terraform**:

```bash
terraform init
```

3. **Review Plan**:

```bash
terraform plan
```

4. **Apply**:

```bash
terraform apply
```

This creates/updates the necessary AWS resources.

---

## Contributing

Contributions are welcome! If you’d like to improve ChromaXen or fix issues:

1. **Fork** this repository.
2. **Create** a new branch: `git checkout -b feature/my-feature`.
3. **Commit** your changes: `git commit -m 'Add new feature'`.
4. **Push** to your branch: `git push origin feature/my-feature`.
5. **Open** a Pull Request describing your changes.

---

## License

ChromaXen is distributed under the [GNU General Public License 3.0](https://www.gnu.org/licenses/gpl-3.0.en.html#license-text).

---

## Contact

- **Email**: [info@chromaxen.com](mailto:info@chromaxen.com)
- **Primary Authors**:
  - Gary Bourgeois (Game concept & design)
  - Otis Runnings (Graphic Design, Programming)
  - Bryne Carruthers (Programming, Github Repository Manager)
  - Chris Rolfe (Programming)

If you encounter any issues or have questions, feel free to open an issue on GitHub or reach out via email.
