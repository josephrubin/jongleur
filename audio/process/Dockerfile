# We're using a custom Docker image instead of the normal Python Lambda construct
# because librosa is too big for a normal Python lambda.
# Rather than use a lambda base image we're going to use a Python base image because
# librosa is very tricky to set up.
FROM python:3.9.9

RUN mkdir "/home/app"
WORKDIR "/home/app"

# Install some packages that we'll need for librosa.
RUN apt-get update -y
RUN apt-get install -y libsndfile-dev

# Librosa depends on numba, and since we are installing our deps as root later
# (because pipenv works best this way in lambda images) we get this bug:
# https://github.com/librosa/librosa/issues/1156
# Changing the numba cache directory fixes the issue.
ENV NUMBA_CACHE_DIR=/tmp/numba_cache/

# The lambda runtime interface is needed to make this Docker image work as a lambda.
RUN python3 -m pip install awslambdaric

# Install the dependancies globally.
RUN python3 -m pip install pipenv
COPY Pipfile* ./
RUN python3 -m pipenv install --system --deploy --ignore-pipfile

COPY *.py ./

# librosa can be slow when it is first used on a system, so run a demo script
# that exercises librosa in order to fill out the relevant OS caches.
# Also this will fail if librosa isn't properly set up, so this is a good check
# during Docker image build time.
RUN python3 prerun.py

# Tell AWS where our lambda handler is.
ENTRYPOINT [ "python3", "-m", "awslambdaric" ]
CMD [ "main.lambda_handler" ]