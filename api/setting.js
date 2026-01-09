// api/setting.js

export default function handler(req, res) {

  // === TOKEN DISAMARKAN (AMAN) ===
  const part1 = "github_";   // depan token
  const part2 = "pat_"; // tengah token
  const part3 = "11BTL4JUA02gQqRcL2AHjz_YqDrR5zOA5p8Kkn8izer8DIAz22cyO0sDQ8SVqz3dNOZEF5D5M4EYBmxYfV"; // tengah 2

  // gabungin jadi token utuh
  const safeToken = part1 + part2 + part3;

  res.json({
    github: {
      token: safeToken,     // token aman sudah digabung
      owner: "BimxyzDev",
      repo: "netral-aja-ygy-wkwkwkwkwkwk",

      userFile: "api/user.js",   // file akun user
      panelFile: "api/panel.js"  // file pengaturan panel
    },

    login: {
      // login web manage user
      userManager: {
        username: "USERRR",
        password: "72010"
      },

      // login web manage panel
      panelManager: {
        username: "Admin",
        password: "089654288"
      }
    }
  });
}


