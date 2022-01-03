# We're using a custom Docker image instead of the normal Python Lambda construct
# because librosa is too big for a normal Python lambda.
#FROM public.ecr.aws/sam/build-python3.9@sha256:76b6f14775a788937e15ce8080eaba204784c7387774add9adb64cb5aaa2f191
FROM public.ecr.aws/lambda/python:3.9

#RUN yum -q list installed rsync &>/dev/null || yum install -y rsync

WORKDIR ${LAMBDA_TASK_ROOT}

# Install pipenv so we can install dependancies.
RUN pip install --upgrade pip
RUN pip install pipenv

# Install the dependancies.
COPY Pipfile* ./
RUN pipenv install

# Move over our python files.
COPY *.py ./

# Tell AWS where our lambda handler is.
CMD [ "main.lambda_handler" ]