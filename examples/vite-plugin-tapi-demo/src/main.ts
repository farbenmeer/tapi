import { client } from "./client";

const form = document.getElementById("greet-form") as HTMLFormElement;
const out = document.getElementById("output") as HTMLParagraphElement;
const nameInput = document.getElementById("name") as HTMLInputElement;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const { greeting } = await client.greet.get({ name: nameInput.value });
  out.textContent = greeting;
});
