import express from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // Filters an image from a public url
  // GET /filteredimage?image_url={{URL}}
  // IT SHOULD
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file
  app.get( "/filteredimage", async ( req, res ) => {
    const imageURL: string = req.query.image_url;
    if (!imageURL) {
      return res.status(400).send({ message: 'Image URL is required' });
    }

    let filteredPath: string;
    try {
      filteredPath = await filterImageFromURL(imageURL);      
    } catch (err) {
      return res.status(422).send({ message: 'Failed to filter the image. Image URL might be malformed' });
    }

    res.sendFile(filteredPath, async (err: Error) => {
      if (err) {
        return res.status(500).send({ message: 'Failed to send the filtered image' });
      }

      try {
        await deleteLocalFiles([ filteredPath ]);
      } catch (err) {
        return res.status(500).send({ message: 'Failed to cleanup the files on the local disk' });
      }
    });    
  } );
  
  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );
  

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();