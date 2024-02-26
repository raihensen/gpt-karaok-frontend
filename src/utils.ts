
import _ from "lodash";


export function generateInvitationCode(length: number = 4) {

  const characters = 'ABCDEFGHJKLPQRSTUVWXYZ456789'
  return _.range(4).map(() => characters.charAt(Math.floor(Math.random() * characters.length))).join("")

}