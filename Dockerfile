FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY Expense-Tracker-Api/package*.json ./Expense-Tracker-Api/

RUN npm ci --prefix Expense-Tracker-Api --include=dev

COPY Expense-Tracker-Api ./Expense-Tracker-Api

RUN npm --prefix Expense-Tracker-Api run prisma:generate

CMD ["npm", "--prefix", "Expense-Tracker-Api", "start"]
