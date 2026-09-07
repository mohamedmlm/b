const commonPasswords = [
  "123456",
  "password",
  "qwerty",
  "123456789",
  "111111",
  "abc123",
  "123123",
  "admin",
  "welcome",
  "iloveyou"
];

function getCharsetSize(password){
  let charset = 0;
  if(/[a-z]/.test(password)) charset += 26;
  if(/[A-Z]/.test(password)) charset += 26;
  if(/[0-9]/.test(password)) charset += 10;
  if(/[^A-Za-z0-9]/.test(password)) charset += 32;
  return charset;
}

function detectWeakPatterns(password){
  const patterns = [];
  if(/(.)\1{2,}/.test(password)) patterns.push("repeated characters");
  if(/123|234|345|456|567|678|789/.test(password)) patterns.push("sequential numbers");
  if(/abc|bcd|cde|def/.test(password)) patterns.push("sequential letters");
  if(commonPasswords.includes(password.toLowerCase())) patterns.push("common password");
  return patterns;
}

function calculateEntropy(password){
  const charset = getCharsetSize(password);
  if(charset === 0) return 0;
  const entropy = password.length * Math.log2(charset);
  return parseFloat(entropy.toFixed(2));
}

function analyzePassword(password){
  if(!password || password.length === 0){
    return { level:"invalid", entropy:0, warnings:["empty password"] };
  }

  const entropy = calculateEntropy(password);
  const patterns = detectWeakPatterns(password);

  let level = "weak";
  if(entropy >= 60) level = "very strong";
  else if(entropy >= 45) level = "strong";
  else if(entropy >= 30) level = "medium";

  if(patterns.length > 0) level = "weak";

  return { level, entropy, patterns };
}

module.exports = analyzePassword;

