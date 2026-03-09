import { useOptimistic, startTransition } from "react";
import { useQuery } from "@farbenmeer/bunny/client";
import { client } from "client";

export function App() {
  const todos = useQuery(client.todos.get());
  const [optimisticTodos, updateOptimistic] = useOptimistic(
    todos,
    (current, update: { id: number; done: boolean }) =>
      current.map((t) => (t.id === update.id ? { ...t, done: update.done } : t))
  );

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Bunny TODO List</h1>
      <form action={client.todos.post}>
        <input name="text" placeholder="Add a todo" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {optimisticTodos.map((todo) => (
          <li key={todo.id}>
            <input
              name="done"
              type="checkbox"
              checked={todo.done}
              onChange={(e) => {
                const newDone = e.currentTarget.checked;
                startTransition(async () => {
                  updateOptimistic({ id: todo.id, done: newDone });
                  await client.todos[todo.id]!.patch({ done: newDone }).revalidated;
                });
              }}
            />
            {todo.text}
            <form
              className="delete-form"
              action={client.todos[todo.id]!.delete}
            >
              <button type="submit">🗑</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
