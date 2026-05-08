Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const deepLink = `family-cookbook://join?token=${encodeURIComponent(token)}`;

  return new Response(null, {
    status: 302,
    headers: { "Location": deepLink },
  });
});
