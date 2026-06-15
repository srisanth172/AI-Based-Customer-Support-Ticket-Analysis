require('dotenv').config({ path: 'backend/.env' });
console.log('GROQ_API_KEY set:', process.env.GROQ_API_KEY ? 'YES (length=' + process.env.GROQ_API_KEY.length + ')' : 'NO / EMPTY');
console.log('OPENROUTER_API_KEY set:', process.env.OPENROUTER_API_KEY ? 'YES (length=' + process.env.OPENROUTER_API_KEY.length + ')' : 'NO / EMPTY');
console.log('BREVO_API_KEY set:', process.env.BREVO_API_KEY ? 'YES (length=' + process.env.BREVO_API_KEY.length + ')' : 'NO / EMPTY');
