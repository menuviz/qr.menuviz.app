"use client";

import { useActionState } from "react";

export default function ProgramForm({ code, action }) {
  const [state, formAction, pending] = useActionState(action, null);
  const destination = state?.ok ? state.destination : code.destination;

  return (
    <section className="program-panel">
      <div className="ping" aria-hidden="true" />
      <p className="eyebrow">Code {code.id}</p>
      <h1>{code.destination ? "Reprogram this Beacon" : "Program this blank Beacon"}</h1>

      {state?.ok ? (
        <div className="success">
          <strong>Saved.</strong> This code now points to{" "}
          <a href={destination} rel="noreferrer">
            {destination}
          </a>
          .
        </div>
      ) : null}

      {state && !state.ok ? <p className="form-error">{state.message}</p> : null}

      <form action={formAction} className="program-form">
        <label>
          Passcode
          <input name="passcode" type="password" autoComplete="current-password" required />
        </label>
        <label>
          Label
          <input
            name="label"
            type="text"
            defaultValue={code.label || ""}
            placeholder="Front counter card"
          />
        </label>
        <label>
          Destination URL
          <input
            name="destination"
            type="text"
            inputMode="url"
            defaultValue={destination || ""}
            placeholder="https://example.com"
            required
          />
        </label>
        <button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save destination"}
        </button>
      </form>

      {state?.ok ? (
        <a className="test-link" href={`/r/${code.id}`}>
          Test live redirect
        </a>
      ) : null}
    </section>
  );
}
