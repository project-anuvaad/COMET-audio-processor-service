FROM hassanamin994/node_ffmpeg
WORKDIR /audio-processor-service

COPY . .
RUN npm install


EXPOSE 4000
CMD [ "npm", "run", "docker:prod"]