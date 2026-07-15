export default function UploadBanner({onFile}) {

  const handleUpload = (e) => {
    const file = e.target.files[0];
    console.log(file);
    onFile(file);
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-6 rounded-xl shadow-lg">

      <h2 className="text-xl font-bold mb-2">
        Upload Road Damage Photo
      </h2>

      <label className="bg-white text-blue-600 px-6 py-2 rounded-lg cursor-pointer font-semibold">
        Upload Image
        <input 
          type="file"
          className="hidden"
          onChange={handleUpload}
        />
      </label>

    </div>
  );
}
