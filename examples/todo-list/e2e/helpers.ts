export async function createTodoViaApi(baseURL: string, text: string) {
  const res = await fetch(`${baseURL}/api/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Failed to create todo: ${res.status}`);
}

export async function deleteAllTodosViaApi(baseURL: string) {
  // Get all todos, then delete each one
  const res = await fetch(`${baseURL}/api/todos`);
  if (!res.ok) return;
  const todos = (await res.json()) as { id: number }[];
  for (const todo of todos) {
    await fetch(`${baseURL}/api/todos/${todo.id}`, { method: "DELETE" });
  }
}
