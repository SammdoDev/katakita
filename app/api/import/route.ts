export async function POST() {
  return Response.json(
    { success: false, errors: ["Kurikulum dikelola terpusat dan tidak menerima upload dari pengguna."] },
    { status: 410 },
  );
}
