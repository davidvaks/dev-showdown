module.exports = (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Missing name" });
  }

  res.status(200).json({ greeting: `Hello ${name}` });
};
