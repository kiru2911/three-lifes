from clearml import PipelineController

PROJECT_NAME = "three-lifes"
PIPELINE_PROJECT = "three-lifes/pipelines"
PIPELINE_NAME = "news-summarization-ollama"
PIPELINE_VERSION = "1.0.0"

FETCH_TASK = "fetch-news-ollama"
SUMMARISE_TASK = "generate-summaries-v2-ollama"
EVALUATE_TASK = "evaluate-summaries-ollama"

UPLOAD_TASK_ID = "ee2ceacd072a4f20bf0a4dbf048f0390"


def main():
    pipe = PipelineController(
        project=PIPELINE_PROJECT,
        name=PIPELINE_NAME,
        version=PIPELINE_VERSION,
        add_pipeline_tags=True,
    )

    pipe.set_default_execution_queue("default")

    pipe.add_step(
        name="fetch_articles",
        base_task_project=PROJECT_NAME,
        base_task_name=FETCH_TASK,
        execution_queue="default",
    )

    pipe.add_step(
        name="generate_summaries_v2",
        base_task_project=PROJECT_NAME,
        base_task_name=SUMMARISE_TASK,
        parents=["fetch_articles"],
        execution_queue="default",
    )

    pipe.add_step(
        name="evaluate_summaries_v2",
        base_task_project=PROJECT_NAME,
        base_task_name=EVALUATE_TASK,
        parents=["generate_summaries_v2"],
        execution_queue="default",
    )

    pipe.add_step(
        name="upload_dataset",
        base_task_id=UPLOAD_TASK_ID,
        parents=["evaluate_summaries_v2"],
        execution_queue="default",
    )

    pipe.start_locally(run_pipeline_steps_locally=True)
    pipe.wait()
    print("Pipeline completed successfully.")


if __name__ == "__main__":
    main()