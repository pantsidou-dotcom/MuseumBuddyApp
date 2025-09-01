function MuseumCard({ name, image, description }) {
  return (
    <div className="border rounded overflow-hidden shadow">
      <img src={image} alt={name} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">{name}</h2>
        <p className="text-sm text-gray-700">{description}</p>
      </div>
    </div>
  );
}

export default MuseumCard;
