FROM python:3.9
ENV PYTHONUNBUFFERED 1
RUN mkdir /itorum_test
WORKDIR /itorum_test
COPY requirements.txt /itorum_test/
RUN pip install --upgrade pip && pip install -r requirements.txt
ADD . /itorum_test/