import { createClient } from 'npm:@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LocationPing {
  vehicle_label: string
  lat: number
  lng: number
  timestamp: string
  speed?: number | null
  heading?: number | null
  accuracy?: number | null
  battery?: number | null
}

interface RequestPayload {
  pings: LocationPing[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify JWT token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { pings }: RequestPayload = await req.json()

    if (!Array.isArray(pings) || pings.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid pings data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify user is a driver and get their assigned vehicle
    const { data: driverData, error: driverError } = await supabaseClient
      .from('drivers')
      .select(`
        assigned_vehicle,
        vehicles!inner(id, label)
      `)
      .eq('user_id', user.id)
      .eq('active', true)
      .single()

    if (driverError || !driverData) {
      return new Response(
        JSON.stringify({ error: 'Driver not found or inactive' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const assignedVehicle = (driverData as any).vehicles
    const assignedVehicleId = driverData.assigned_vehicle

    // Process each ping
    const processedPings = []
    const errors = []

    for (const ping of pings) {
      try {
        // Verify this ping is for the driver's assigned vehicle
        if (ping.vehicle_label !== assignedVehicle.label) {
          errors.push(`Ping for vehicle ${ping.vehicle_label} rejected - not assigned to driver`)
          continue
        }

        // Validate ping data
        if (!ping.lat || !ping.lng || !ping.timestamp) {
          errors.push('Invalid ping data - missing required fields')
          continue
        }

        // Validate coordinates
        if (ping.lat < -90 || ping.lat > 90 || ping.lng < -180 || ping.lng > 180) {
          errors.push('Invalid coordinates')
          continue
        }

        // Insert into vehicle_positions table
        const { data: insertData, error: insertError } = await supabaseClient
          .from('vehicle_positions')
          .insert({
            vehicle_id: assignedVehicleId,
            lat: ping.lat,
            lng: ping.lng,
            timestamp: ping.timestamp,
            speed: ping.speed,
            heading: ping.heading,
            accuracy: ping.accuracy,
            battery: ping.battery,
          })
          .select()

        if (insertError) {
          console.error('Insert error:', insertError)
          errors.push(`Failed to insert ping: ${insertError.message}`)
        } else {
          processedPings.push(insertData[0])
        }

      } catch (error) {
        console.error('Processing error:', error)
        errors.push(`Error processing ping: ${error.message}`)
      }
    }

    // Return response
    const response = {
      success: true,
      processed: processedPings.length,
      total: pings.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully processed ${processedPings.length} of ${pings.length} pings`
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})