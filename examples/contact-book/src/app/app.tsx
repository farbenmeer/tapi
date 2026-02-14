import { Route, Switch } from "@farbenmeer/router";
import { ContactList } from "./contact-list";
import { ContactDetail } from "./contact-detail";
import { ContactForm } from "./contact-form";

export function App() {
  return (
    <div>
      <h1 data-testid="app-title">Contact Book</h1>
      <Switch>
        <Route path="/" exact>
          <ContactList />
        </Route>
        <Route path="/contacts/new" exact>
          <ContactForm />
        </Route>
        <Route path="/contacts/:id">
          <ContactDetail />
        </Route>
        <Route path="*">
          <div data-testid="not-found">
            <h2>404 - Page Not Found</h2>
          </div>
        </Route>
      </Switch>
    </div>
  );
}
