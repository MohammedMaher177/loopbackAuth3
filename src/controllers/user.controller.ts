// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/core';
import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors, get, post, requestBody} from '@loopback/rest';
import {SecurityBindings, UserProfile} from "@loopback/security";
import {compareSync, hashSync} from "bcryptjs";
import {User} from '../models';
import {UserRepository} from '../repositories';
interface LabeledValueLogin {
  email: string;
  password: string;
}
interface LabeledValueSignup {
  email: string;
  password: string;
}

export class UserController {
  constructor(
    @repository(UserRepository) public userRepository: UserRepository,
    @inject(SecurityBindings.USER)
    private userProfile: UserProfile,

  ) { }

  @post("/auth/login", {
    responses: {
      "200": {
        description: "log in",
      },
    },
  })
  async login(@requestBody() credential: LabeledValueLogin): Promise<object> {
    const user = await this.userRepository.findOne({where: {email: credential.email}})
    if (!user) {
      throw new HttpErrors.NotFound("Email Not Exist, please Rigester")
    }
    const match = compareSync(credential.password, user.password)
    if (!match) {
      throw new HttpErrors.BadRequest("In-Valid Password")
    }
    const token = user.generateToken()
    return {token}
  }

  @post("/auth/signup", {
    responses: {
      "200": {
        description: "sign up",
      },
    },
  })
  async signup(@requestBody() credential: LabeledValueSignup): Promise<User> {
    console.log(credential);

    if (!credential) {
      throw new HttpErrors.NotFound("Please insert Your Email and Password")
    }
    if (!credential.email) {
      throw new HttpErrors.NotFound("Please insert Your Email")
    }
    if (!credential.password) {
      throw new HttpErrors.NotFound("Please insert Your Password")
    }

    const existUser = await this.userRepository.findOne({where: {email: credential.email}})

    if (existUser) {
      throw new HttpErrors.NotFound("Email Already Exist, please Log in")
    }

    const hashPassword = hashSync(credential.password, 8)

    return this.userRepository.create({email: credential.email, password: hashPassword})

  }
  @authenticate("basic")
  @get("/users", {
    responses: {
      "200": {
        description: "Get All Users",
      },
    },
  })
  async find(): Promise<User[]> {
    return this.userRepository.find()
  }

  // @authenticate('basic')
  // @get('/whoami')
  // whoAmI(): string {
  //   return this.userProfile[User];
  // }

  // @authenticate('basic', {gatherStatistics: false})
  // @get('/scareme')
  // scareMe(): string {
  //   return 'boo!';
  // }

}
