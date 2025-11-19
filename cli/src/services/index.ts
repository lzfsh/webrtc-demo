import greet, { name as greetName, type GreetService } from './greet'
import { sortLoadables } from '../core/define'

const services = sortLoadables(greet)

export type ServiceHub = {
  [greetName]: GreetService
}

export default services
