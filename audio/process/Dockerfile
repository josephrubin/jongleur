# We're using a custom Docker image instead of the normal Python Lambda construct
# because librosa is too big for a normal Python lambda.
FROM public.ecr.aws/lambda/python:3.9

WORKDIR ${LAMBDA_TASK_ROOT}

# Install pipenv so we can install dependancies.
RUN pip install --upgrade pip
RUN pip install pipenv

# Install the dependancies.
COPY Pipfile* ./
RUN pipenv install --system --deploy --ignore-pipfile

# Move over our python files.
COPY *.py ./

# Tell AWS where our lambda handler is.
CMD [ "main.lambda_handler" ]