# Agent Worker

The worker claims queued `AgentJob` records, clones the connected public GitHub repository into a temporary directory, asks OpenAI to make task-scoped edits, and stores the resulting diff and summary on the job. It does not run repository code, push branches, or open pull requests.

Set these values in the environment used by the worker:

```env
DATABASE_URL=your_postgres_connection_string
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
```

Repository source files are sent to the configured OpenAI model when the agent reads them. Use only repositories you are authorized to process. Private repositories are not supported by this MVP.

Start the worker from the repository root:

```sh
bun run --filter agent-worker dev
```

The backend and worker must both be running. Create a task on a board with a connected repository, then click **Start Agent** on that task. Review the saved diff before using any of the changes.
