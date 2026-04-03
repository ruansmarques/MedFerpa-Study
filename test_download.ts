async function testDownload() {
  const res = await fetch('https://drive.google.com/uc?export=download&id=1b04n1JWtLCK9sFkaNc7DZQaJBvAIESlk');
  console.log(res.status);
  console.log(res.headers.get('content-type'));
  const text = await res.text();
  console.log(text.substring(0, 200));
}
testDownload();
