"use client";

export default function DeleteCodeForm({ id, action }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete code ${id} and all of its scan history? This cannot be undone.`
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="link-button danger-link">
        Delete
      </button>
    </form>
  );
}
