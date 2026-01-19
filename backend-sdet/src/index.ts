import express from 'express';
import cors from 'cors';
import { initFirebase } from './config/firebase';
import routes from './routes';

initFirebase();

const app = express();
const port = process.env.PORT || 3100;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
