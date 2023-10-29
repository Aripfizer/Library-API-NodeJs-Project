import { Book, PrismaClient } from "@prisma/client";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDate,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNotIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinDate,
  ValidateNested,
  validate,
} from "class-validator";
import {
  IsAvailable,
  IsBookAvalableToLoan,
  IsBookIdExists,
  IsUnique,
  IsValidReturnDate,
} from "./custom-rugles";

const prisma = new PrismaClient();
export class UserLoginDto {
  @IsNotEmpty({ message: "L'adresse email est obligatoire" })
  @IsEmail({}, { message: "Veuillez entrer une adresse email valide" })
  email!: string;

  @IsNotEmpty({ message: "Le mot de passe ne doit pas être vide" })
  @Length(6, undefined, {
    message: "Le mot de passe doit comporter au moins 6 caractères",
  })
  @Matches(/[a-z]/, {
    message: "Le mot de passe doit comporter au moins une lettre minuscule",
  })
  @Matches(/[A-Z]/, {
    message: "Le mot de passe doit comporter au moins une lettre majuscule",
  })
  @Matches(/[0-9]/, {
    message: "Le mot de passe doit comporter au moins un chiffre",
  })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: "Le mot de passe doit comporter au moins un caractère spécial",
  })
  password!: string;
}

// @ValidatorConstraint({ name: "emailId", async: true })
// export class UniqueEmailvalidation implements ValidatorConstraintInterface {
//   constructor(private readonly prisma: PrismaClient) {}

//   async validate(value: string, args: ValidationArguments): Promise<boolean> {
//     return this.prisma.user
//       .findFirst({ where: { email: value } })
//       .then((user) => {
//         if (user) return false;
//         return true;
//       });
//   }
//   defaultMessage(args: ValidationArguments) {
//     return `L'adresse email est déjà utiliser`;
//   }
// }

// @ValidatorConstraint({ async: true })
// export class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
//   async validate(email: string) {
//     const user = await prisma.user.findFirst({
//       where: { email },
//     });
//     return !user;
//   }

//   defaultMessage() {
//     return "L'adresse email est déjà utilisée";
//   }
// }

// export function IsEmailUnique(validationOptions?: ValidationOptions) {
//   validationOptions = {
//     ...{ message: "L'adresse email est déjà utilisée" },
//     ...validationOptions,
//   };
//   return function (object: any, propertyName: string) {
//     registerDecorator({
//       target: object.constructor,
//       propertyName: propertyName,
//       options: validationOptions,
//       constraints: [],
//       validator: IsEmailUniqueConstraint,
//     });
//   };
// }

export class UserRegisterDto {
  @IsNotEmpty({ message: "L'adresse email est obligatoire" })
  @IsEmail({}, { message: "Veuillez entrer une adresse email valide" })
  @IsUnique("user", "email", {
    message: "Cette adresse email est déjà utilisée",
  })
  email!: string;

  @IsString({ message: "Le prénom doit être une chaîne de caractères" })
  @Length(1, 50, { message: "Le prénom est obligatoire" })
  firstname!: string;

  @IsString({ message: "Le nom doit être une chaîne de caractères" })
  @Length(1, 50, { message: "Le nom est obligatoire" })
  lastname!: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsNotIn([1])
  @IsAvailable("role", "id", {
    message: "Un ou plusieurs roles spécifiés n'existent pas",
  })
  roles?: number[];
}

export class UserUpdateDto {
  @IsOptional()
  @IsEmail({}, { message: "Veuillez entrer une adresse email valide" })
  @IsUnique("user", "email", {
    message: "Cette adresse email est déjà utilisée",
  })
  email?: string;

  @IsOptional()
  @IsString({ message: "Le  doitprénom être une chaîne de caractères" })
  @Length(1, 50, { message: "Le prénom est obligatoire" })
  firstname?: string;

  @IsOptional()
  @IsString({ message: "Le nom doit être une chaîne de caractères" })
  @Length(1, 50, { message: "Le nom est obligatoire" })
  lastname?: string;
}

// @ValidatorConstraint({ async: true })
// export class IsRoleUniqueConstraint implements ValidatorConstraintInterface {
//   async validate(name: string) {
//     const role = await prisma.role.findFirst({
//       where: { name },
//     });
//     return !role;
//   }

//   defaultMessage(args: ValidationArguments) {
//     return "Le role '" + args.value + "' existe déja !";
//   }
// }

// export function IsRoleUnique(validationOptions?: ValidationOptions) {
//   validationOptions = {
//     ...{ message: "Le role existe déja" },
//     ...validationOptions,
//   };
//   return function (object: any, propertyName: string) {
//     registerDecorator({
//       target: object.constructor,
//       propertyName: propertyName,
//       options: validationOptions,
//       constraints: [],
//       validator: IsRoleUniqueConstraint,
//     });
//   };
// }

export class RolePermissionsAddDto {

  @IsArray({
    message: "Les permisions doivent etre renseigner dans un tableau",
  })
  @ArrayMinSize(1, { message: "Au moins une permission doit être spécifié" })
  @ArrayUnique({
    message: "Vous devez selectionner des permissions disctincts",
  })
  @IsAvailable("permission", "id", {
    message: "Un ou plusieurs permissions spécifiés n'existent pas",
  })
  permissions!: number[];
}
export class UserRolesAddDto {

  @IsArray({
    message: "Les roles doivent etre renseigner dans un tableau",
  })
  @ArrayMinSize(1, { message: "Au moins un role doit être spécifié" })
  @ArrayUnique({
    message: "Vous devez selectionner des roles disctincts",
  })
  @IsAvailable("role", "id", {
    message: "Un ou plusieurs roles spécifiés n'existent pas",
  })
  roles!: number[];
}
export class RoleCreateDto {
  @IsNotEmpty({ message: "Le nom est obligatoire" })
  @IsString({ message: "Le nom doit être une chaîne de caractères" })
  @IsUnique("role", "name", { message: "Ce nom est déjà utilisé." })
  name!: string;

  @IsArray({
    message: "Les permisions doivent etre renseigner dans un tableau",
  })
  @ArrayMinSize(1, { message: "Au moins une permission doit être spécifié" })
  @ArrayUnique({
    message: "Vous devez selectionner des permissions disctincts",
  })
  @IsAvailable("permission", "id", {
    message: "Un ou plusieurs permissions spécifiés n'existent pas",
  })
  permissions!: number[];
}
export class RoleUpdateDto {
  @IsNotEmpty({ message: "Le nom est obligatoire" })
  @IsString({ message: "Le nom doit être une chaîne de caractères" })
  @IsUnique("role", "name", { message: "Ce nom est déjà utilisé." })
  name!: string;
}

export class BookCreateDto {
  @IsNotEmpty({ message: "Le titre est obligatoire" })
  @IsString({ message: "Le titre doit être une chaîne de caractères" })
  @IsUnique("book", "title", { message: "Ce nom est déjà utilisé." })
  title!: string;

  @IsNotEmpty({ message: "La description est obligatoire" })
  @IsString({ message: "La description doit être une chaîne de caractères" })
  resume!: string;

  @IsNotEmpty({ message: "L'ISBN est obligatoire" })
  @IsString({ message: "L'ISBN doit être une chaîne de caractères" })
  @IsUnique("book", "isbn", { message: "L'ISBN est déjà utilisé." })
  isbn!: string;

  @IsOptional()
  @IsInt({ message: "La quantité doit être un entier" })
  quantity?: number;
}
export class BookUpdateDto {
  @IsOptional()
  @IsString({ message: "Le titre doit être une chaîne de caractères" })
  @IsUnique("book", "title", { message: "Ce nom est déjà utilisé." })
  title!: string;

  @IsOptional()
  @IsString({ message: "La description doit être une chaîne de caractères" })
  resume!: string;

  @IsOptional()
  @IsString({ message: "L'ISBN doit être une chaîne de caractères" })
  @IsUnique("book", "isbn", { message: "L'ISBN est déjà utilisé." })
  isbn!: string;

  @IsOptional()
  @IsInt({ message: "La quantité doit être un entier" })
  quantity?: number;
}

export class BookLoanDto {
  @IsArray()
  @ArrayMinSize(1, { message: "Au moins un livre doit être spécifié" })
  @ArrayMaxSize(Number(process.env.MAX_BOOK_PER_LOAN), {
    message: `Au plus ${process.env.MAX_BOOK_PER_LOAN} livres doivent être spécifiés`,
  })
  @ArrayUnique()
  @IsBookIdExists({
    message: "Un ou plusieurs livres spécifiés n'existent pas",
  })
  @ValidateNested({ each: true })
  @IsBookAvalableToLoan({
    message: "Certains Livres ne sont pas disponible pour emprunt",
  })
  books!: number[];

  @IsNotEmpty({
    message: "La date d'emprunt est obligatoire",
  })
  @IsDate({
    message: "La date d'emprunt doit être une date valide",
  })
  @MinDate(new Date(), {
    message: "La date d'emprunt doit être à partir de l'instant présent",
  })
  loanAt!: Date;

  @IsNotEmpty({
    message: "La date prévue du retour est obligatoire",
  })
  @IsDate({
    message: "La date prévue du retour doit être une date valide",
  })
  @IsValidReturnDate({
    message: "La date de retour doit être apres la date d'emprunt",
  })
  supposedReturnAt!: Date;
}

export async function checkErrors(data: any) {
  let errors = await validate(data);
  if (errors.length) {
    errors = errors.map((error: any) => {
      return { property: error.property, infos: error.constraints };
    });
  }
  return errors;
}
