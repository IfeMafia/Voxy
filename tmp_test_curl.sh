curl -s https://api.cencori.com/api/ai/chat \
  -H "CENCORI_API_KEY: csk_65ebe2dc91d140844d7eb6c98ac21dcc21e5d14cafb5bd94" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Respond with Curl works!"}], "stream": false}'
