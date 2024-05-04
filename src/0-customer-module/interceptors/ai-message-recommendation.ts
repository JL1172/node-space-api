import axios from 'axios';
import 'dotenv/config';
async function run(text) {
  try {
    const response = await axios.post(String(process.env.SAPLING_API_URL), {
      key: process.env.SAPLING_API_KEY,
      text,
    });
    const { status, data } = response;
    console.log({ status });
    console.log(JSON.stringify(data, null, 4));
  } catch (err) {
    const { msg } = err.response.data;
    console.log({ err: msg });
  }
}

run('How are you?');
