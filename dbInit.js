require('dotenv').config();
const Sequelize = require('sequelize');

console.log(process.env.DATABASE_URL);

const sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false,
});

const Movie = require('./models/Movies')(sequelize, Sequelize.DataTypes);
const Genre = require('./models/Genre')(sequelize, Sequelize.DataTypes);
const Settings = require('./models/Settings')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');
const alter = process.argv.includes('--alter') || process.argv.includes('-a');

sequelize.sync({ force, alter }).then(async () => {
	const movies = [
		Movie.upsert({ name: 'Film1', genre_id: 1, platform: 'hey' }),
		Movie.upsert({ name: 'Film2', genre_id: 1, platform: 'hey' }),
		Movie.upsert({ name: 'Film3', genre_id: 1, platform: 'hey' }),
		Movie.upsert({ name: 'Film4', genre_id: 2, platform: 'hey' }),
	];
	const genres = [
		Genre.upsert({ name: 'Action', color: '0x12312' }),
		Genre.upsert({ name: 'Drama', color: '0x32212' }),
	];
	const settings = [
		Settings.upsert({ guild_id: '599895341487226881', prefix: '!' }),
	];
	await Promise.all(movies);
	await Promise.all(genres);
	await Promise.all(settings);
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);