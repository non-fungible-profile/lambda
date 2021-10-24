import { config } from 'dotenv';
import { server } from './server';

config();

const HTTP_PORT = process.env.HTTP_PORT || 3000;

server.listen(HTTP_PORT, () => console.log(`Server started on ${HTTP_PORT}`));
