import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ){}

  async create(createPokemonDto: CreatePokemonDto) {
    
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } 
    catch (error) {
      this.handleException(error);    
    }
  }

  async findAll() {
    const pokemons = await this.pokemonModel.find();

    if(!pokemons){
      throw new NotFoundException(`Pokemon list is empty`)
    }

    return pokemons;
  }

  async findOne(param: string) {

    let pokemon: Pokemon;

    if(!isNaN(+param)){
      pokemon = await this.pokemonModel.findOne({ num: param });
      return pokemon;
    }

    if (!pokemon && isValidObjectId(param) ) {
      pokemon = await this.pokemonModel.findById(param)
      return pokemon;
    } 
    
    if(!pokemon) {
      pokemon = await this.pokemonModel.findOne({ name: param });
      return pokemon;
    }

    if (!pokemon) {
      throw new NotFoundException(`Pokemon with id, name or num "${param}" not found`)
    }

    return pokemon;
  }

  async update(param: string, updatePokemonDto: UpdatePokemonDto) {
    
    const pokemon = await this.findOne(param);
    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();
    }

    try {
      
      await pokemon.updateOne(updatePokemonDto)

      return {...pokemon.toJSON(), ...updatePokemonDto};
    } 
    catch (error) {

      this.handleException(error);
    }
  }

  async remove(id: string) {

    // const pokemon = await this.findOne(id);
    // await pokemon.deleteOne();

    // const pokemonDeleted = await this.pokemonModel.findByIdAndDelete(id);

    const {deletedCount} = await this.pokemonModel.deleteOne({_id: id});
    if(deletedCount === 0){
      throw new BadRequestException(`pokemon with id: "${id}" not found`)
    }
    return;
  }


  private handleException(error: any){

    if (error.code === 11000) {
      throw new BadRequestException(`Pokemon exists in db ${ JSON.stringify(error.keyValue )}`);
    }

    console.log(error);  
    throw new InternalServerErrorException(`Can't create Pokemon - Check server logs`);
  }
}
