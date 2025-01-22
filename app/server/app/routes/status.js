const express = require("express");
// ---
const {
  axiosFormio,
  formUrl,
  formIntroSubstring,
} = require("../config/formio");
const { getSamEntities } = require("../utilities/bap");

/**
 * Return the intro text from the "Welcome" section of a form.
 */
function getFormIntroText(schema) {
  const intro = schema.components.find((c) => c.title === "Welcome");
  if (!intro) return "";

  const result = intro.components.reduce((string, component) => {
    const { type, tag, content } = component;
    const text = type === "htmlelement" && tag !== "style" && content;
    if (text)
      string += text
        .replace(/"/g, "'") // convert double quotes to single quotes
        .replace(/\r?\n/g, "") // remove new line characters
        .replace(/\s\s+/g, " "); // remove double spaces
    return string;
  }, "");

  return result;
}

/**
 * Verify the schema has a type of form, a title exists, and the form's intro
 * text contains the correct value (confirming Formio returns the valid schema).
 */
function verifySchema({ schema, substring }) {
  return (
    schema.type === "form" &&
    !!schema.title &&
    getFormIntroText(schema).includes(substring)
  );
}

const router = express.Router();

router.get("/app", (_req, res) => {
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
  const substring = formIntroSubstring["2022"].frf;

  axiosFormio(req)
    .get(formUrl["2022"].frf)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema({ schema, substring }) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

router.get("/formio/2022/prf", (req, res) => {
  const substring = formIntroSubstring["2022"].prf;

  axiosFormio(req)
    .get(formUrl["2022"].prf)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema({ schema, substring }) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

router.get("/formio/2022/crf", (req, res) => {
  const substring = formIntroSubstring["2022"].crf;

  axiosFormio(req)
    .get(formUrl["2022"].crf)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema({ schema, substring }) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

router.get("/formio/2023/frf", (req, res) => {
  const substring = formIntroSubstring["2023"].frf;

  axiosFormio(req)
    .get(formUrl["2023"].frf)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema({ schema, substring }) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

router.get("/formio/2023/prf", (req, res) => {
  const substring = formIntroSubstring["2023"].prf;

  axiosFormio(req)
    .get(formUrl["2023"].prf)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema({ schema, substring }) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

// router.get("/formio/2023/crf", (req, res) => {
//   const substring = formIntroSubstring["2023"].crf;
//
//   axiosFormio(req)
//     .get(formUrl["2023"].crf)
//     .then((axiosRes) => axiosRes.data)
//     .then((schema) => {
//       return res.json({ status: verifySchema({ schema, substring }) });
//     })
//     .catch((_error) => {
//       // NOTE: error is logged in axiosFormio response interceptor
//       return res.json({ status: false });
//     });
// });

router.get("/formio/2023/change", (req, res) => {
  const substring = "";

  axiosFormio(req)
    .get(formUrl["2023"].change)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema({ schema, substring }) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

router.get("/formio/2024/frf", (req, res) => {
  const substring = formIntroSubstring["2024"].frf;

  axiosFormio(req)
    .get(formUrl["2024"].frf)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema({ schema, substring }) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

router.get("/formio/2024/prf", (req, res) => {
  const substring = formIntroSubstring["2024"].prf;

  axiosFormio(req)
    .get(formUrl["2024"].prf)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema({ schema, substring }) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

// router.get("/formio/2024/crf", (req, res) => {
//   const substring = formIntroSubstring["2024"].crf;
//
//   axiosFormio(req)
//     .get(formUrl["2024"].crf)
//     .then((axiosRes) => axiosRes.data)
//     .then((schema) => {
//       return res.json({ status: verifySchema({ schema, substring }) });
//     })
//     .catch((_error) => {
//       // NOTE: error is logged in axiosFormio response interceptor
//       return res.json({ status: false });
//     });
// });

router.get("/formio/2024/change", (req, res) => {
  const substring = "";

  axiosFormio(req)
    .get(formUrl["2024"].change)
    .then((axiosRes) => axiosRes.data)
    .then((schema) => {
      return res.json({ status: verifySchema({ schema, substring }) });
    })
    .catch((_error) => {
      // NOTE: error is logged in axiosFormio response interceptor
      return res.json({ status: false });
    });
});

module.exports = router;
