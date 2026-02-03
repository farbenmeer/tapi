import { useQuery } from "@farbenmeer/bunny/client";
import { client } from "client";

export function App() {
  const todos = useQuery(client.todos.get());

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Bunny TODO List</h1>
      <form action={client.todos.post}>
        <input name="text" placeholder="Add a todo" />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              name="done"
              type="checkbox"
              checked={todo.done}
              onChange={(e) =>
                client.todos[todo.id]!.patch({
                  done: e.currentTarget.checked,
                })
              }
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
