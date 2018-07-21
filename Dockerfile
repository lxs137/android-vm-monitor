FROM registry.njuics.cn/library/node:latest

# RUN echo "deb http://www.deb-multimedia.org jessie main non-free" >> /etc/apt/sources.list && \
# 	apt-get update && \
# 	apt-get --yes --force-yes install ffmpeg

# RUN git clone https://github.com/kn007/silk-v3-decoder.git /root/backend/silk-v3-decoder && \
# 	cd /root/backend/silk-v3-decoder/silk && \
# 	make clean && \
# 	make 

# COPY ./dist /root/backend/dist
# COPY ./node_modules /root/backend/node_modules

COPY ./ /root/backend

WORKDIR /root/backend

EXPOSE 3000

CMD ["node", "dist/server.js"]