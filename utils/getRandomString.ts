function getRandomString(num = 10) {
  const ALPHABET =
    "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM-_";
  const length = ALPHABET.length;
  let string = "";
  for (let i = 0; i < num; i++) {
    let index = Math.floor(Math.random() * length);
    string += ALPHABET[index];
  }
  return string;
}

export default getRandomString;
