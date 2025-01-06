const express = require("express");
// ---
const { axiosFormio, formUrl } = require("../config/formio");
const { getSamEntities } = require("../utilities/bap");

/**
 * Verify that schema has type of form and a title exists
 * (confirming Formio returned a valid schema).
 */
function verifySchema(schema) {
  return schema.type === "form" && !!schema.title;
}

const router = express.Router();

router.get("/app", (req, res) => {
  return res.json({ status: true });
});

router.get("/bap/sam", (req, res) => {
  getSamEntities(req, "bap.sam.data.status@erg.com")
    .then((bapRes) => {
      if (!Array.isArray(bapRes)) {
        throw Error();
      }

      return res.json({ status: true });
    })
    .catch((_error) => {
      // NOTE: logged in bap verifyBapConnection
      return res.json({ status: false });
    });
});

router.get("/formio/2022/frf", (req, res) => {
  axiosFormio(req)
    .get(formUrl["2022"].frf)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema(schema) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

router.get("/formio/2022/prf", (req, res) => {
  axiosFormio(req)
    .get(formUrl["2022"].prf)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema(schema) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

router.get("/formio/2022/crf", (req, res) => {
  axiosFormio(req)
    .get(formUrl["2022"].crf)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema(schema) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

router.get("/formio/2023/frf", (req, res) => {
  axiosFormio(req)
    .get(formUrl["2023"].frf)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema(schema) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

router.get("/formio/2023/prf", (req, res) => {
  axiosFormio(req)
    .get(formUrl["2023"].prf)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema(schema) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

// router.get("/formio/2023/crf", (req, res) => {
//   axiosFormio(req)
//     .get(formUrl["2023"].crf)
//     .then((axiosRes) => axiosRes.data)
//     .then((schema) => {
//       return res.json({ status: verifySchema(schema) });
//     })
//     .catch((_error) => {
//       // NOTE: error is logged in axiosFormio response interceptor
//       return res.json({ status: false });
//     });
// });

router.get("/formio/2023/change", (req, res) => {
  axiosFormio(req)
    .get(formUrl["2023"].change)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema(schema) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

router.get("/formio/2024/frf", (req, res) => {
  axiosFormio(req)
    .get(formUrl["2024"].frf)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema(schema) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

router.get("/formio/2024/prf", (req, res) => {
  axiosFormio(req)
    .get(formUrl["2024"].prf)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema(schema) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

// router.get("/formio/2024/crf", (req, res) => {
//   axiosFormio(req)
//     .get(formUrl["2024"].crf)
//     .then((axiosRes) => axiosRes.data)
//     .then((schema) => {
//       return res.json({ status: verifySchema(schema) });
//     })
//     .catch((_error) => {
//       // NOTE: error is logged in axiosFormio response interceptor
//       return res.json({ status: false });
//     });
// });

router.get("/formio/2024/change", (req, res) => {
  axiosFormio(req)
    .get(formUrl["2024"].change)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema(schema) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

module.exports = router;
