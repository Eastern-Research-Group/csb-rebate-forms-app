const express = require("express");

/**
 * @typedef {Object} User
 * @property {string} mail
 * @property {string} memberof
 * @property {string} nameID
 * @property {string} nameIDFormat
 * @property {string} spNameQualifier
 * @property {string} sessionIndex
 * @property {number} iat
 * @property {number} exp
 */

/**
 * Determines if the user is an admin or helpdesk user and if they have any BAP
 * combo keys.
 *
 * @param {Object} param
 * @param {express.Request} param.req
 */
function checkUserData({ req }) {
  /** @type {{ bapComboKeys: string[]; user: User }} */
  const { bapComboKeys, user } = req;

  const userRoles = user.memberof.split(",");
  const adminOrHelpdeskUser =
    userRoles.includes("csb_admin") || userRoles.includes("csb_helpdesk");

  const noBapComboKeys = bapComboKeys?.length === 0;

  return { adminOrHelpdeskUser, noBapComboKeys };
}

module.exports = {
  checkUserData,
};
