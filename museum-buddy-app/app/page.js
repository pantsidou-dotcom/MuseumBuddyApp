export default function Home() {
  return (
    <>
      <header className="bg-blue-100 p-4">
        <h1 className="text-2xl font-bold">Museum Buddy App</h1>
        <nav className="mt-2 flex space-x-4">
          <a href="#" className="text-blue-700 hover:underline">Home</a>
          <a href="#" className="text-blue-700 hover:underline">About</a>
          <a href="#" className="text-blue-700 hover:underline">Contact</a>
        </nav>
      </header>
      <main className="p-4">
        <section className="mt-8 rounded border-2 border-dashed border-gray-300 p-8 text-gray-500">
          Placeholder content goes here.
        </section>
      </main>
    </>
  )
}
