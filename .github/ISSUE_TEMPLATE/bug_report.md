name: Bug Report
description: Report a bug
labels: ["bug"]
body:
  - type: textarea
    attributes:
      label: What happened?
      description: A clear description of the bug.
    validations:
      required: true
  - type: textarea
    attributes:
      label: Steps to reproduce
      description: Minimal steps to reproduce the issue.
    validations:
      required: true
  - type: input
    attributes:
      label: WorksLocal version
      placeholder: "0.1.0"
    validations:
      required: true
  - type: input
    attributes:
      label: Node.js version
      placeholder: "20.x"
  - type: dropdown
    attributes:
      label: Operating system
      options:
        - macOS
        - Linux
        - Windows