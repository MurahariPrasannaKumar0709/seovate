FROM mcr.microsoft.com/playwright:v1.48.2-jammy

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

COPY . .

ENV NODE_ENV=production
EXPOSE 4000

CMD ["npm", "start"]
