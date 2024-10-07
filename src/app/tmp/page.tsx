const { Translate } = require("@google-cloud/translate").v2;

const translate = new Translate();
const target = "The target language for language names, e.g. ru";

async function listLanguagesWithTarget() {
  const [languages]: any = await translate.getLanguages(target);

  console.log("Languages:");
  languages.forEach((language) => console.log(language));
}

export default async function TMP() {
  await listLanguagesWithTarget();
  return <div></div>;
}
